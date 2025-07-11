import { useEffect, useState } from "react";
import { api } from "../api";
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

import CONFIGS from "../config";

import Icon_Terminal_fill from "../assets/icons/terminal-fill.svg";
import Icon_Box_seam_fill from "../assets/icons/box-seam-fill.svg";
import Icon_Images from "../assets/icons/images.svg";
import Icon_Bar_chart_fill from "../assets/icons/bar-chart-fill.svg";
import Icon_Files from "../assets/icons/files.svg";

function getExplanation(item) {
    const matched = Object.entries(CONFIGS.MODEL_EXPLANATION).find(([pattern]) =>
        new RegExp(pattern).test(item)
    );
    return matched ? matched[1] : [];
}

function ImageCard({ taskID, filePath }) {
    const [base64, setBase64] = useState("");

    useEffect(() => {
        api.get('/ITraining/getTrainingTaskOutputFile', {
            params: {
                taskID: taskID,
                filePath: filePath
            }
        })
            .then(data => {
                if (data.code === 200) {
                    setBase64(data.data.base64);
                }
            })
            .catch(err => {
                console.error("获取图像Base64失败:", err);
            });
    }, [taskID, filePath]);

    return base64 ? (
        <>
            <img src={`${base64}`} alt={filePath} style={{ width: '100%' }} />
        </>
    ) : (
        <span>加载中...</span>
    )
}

function analyzeTrainingResults(csvData) {
    // https://zhuanlan.zhihu.com/p/1906009403691349479
    const rows = csvData.split("\n").map(row => row.split(","));
    const data = rows.slice(1);

    let mAP50Data = [];
    let precisionData = [];
    let recallData = [];
    let lossData = [];
    let epochData = [];

    data.forEach(row => {
        const epoch = row[0];
        const mAP50 = parseFloat(row[7]);
        const precision = parseFloat(row[5]);
        const recall = parseFloat(row[6]);
        const valLoss = parseFloat(row[9]);
        const clsLoss = parseFloat(row[3]);

        mAP50Data.push({ epoch, mAP50 });
        precisionData.push({ epoch, precision });
        recallData.push({ epoch, recall });
        lossData.push({ epoch, valLoss, clsLoss });
        epochData.push(epoch);
    });

    let analysisReport = "根据你的模型结果数据，我们进行了以下分析与建议:\n";

    // mAP趋势对比
    const mAP50Trend = mAP50Data.map(item => item.mAP50);
    const avgmAP50 = mAP50Trend.reduce((acc, val) => acc + val, 0) / mAP50Trend.length;
    if (avgmAP50 < 0.5) {
        analysisReport += `mAP@0.5值较低，平均值为${avgmAP50.toFixed(2)}，模型可能需要更多的训练或数据增强。\n`;
    }

    // 高精准低召回 / 低精准高召回
    const precisionTrend = precisionData.map(item => item.precision);
    const recallTrend = recallData.map(item => item.recall);
    if (precisionTrend[precisionTrend.length - 1] < 0.5 && recallTrend[recallTrend.length - 1] > 0.8) {
        analysisReport += `模型的precision（精确度）较低且recall（召回率）较高，可能说明模型过于激进，误报频繁。建议降低学习率或调整损失函数。\n`;
    } else if (precisionTrend[precisionTrend.length - 1] > 0.8 && recallTrend[recallTrend.length - 1] < 0.5) {
        analysisReport += `模型的precision（精确度）较高且recall（召回率）较低，可能说明模型过于保守，漏检严重。建议增加数据量或改进数据增强。\n`;
    }

    // 损失曲线解读
    const valLossTrend = lossData.map(item => item.valLoss);
    const clsLossTrend = lossData.map(item => item.clsLoss);
    if (valLossTrend[49] > valLossTrend[48]) {
        analysisReport += `val_loss在第50个epoch后开始上升，模型可能发生了过拟合，建议降低学习率或提前停止训练。\n`;
    }

    if (clsLossTrend.some(loss => loss > 1.0)) {
        analysisReport += `cls_loss波动剧烈，可能是学习率设置过高，建议调整学习率。\n`;
    }

    // 收敛与过拟合：val/cls_loss上升且train/cls_loss下降
    if (valLossTrend.length > 1 && clsLossTrend.length > 1) {
        const valClsLossTrend = valLossTrend[valLossTrend.length - 1] - valLossTrend[valLossTrend.length - 2];
        const trainClsLossTrend = clsLossTrend[clsLossTrend.length - 1] - clsLossTrend[clsLossTrend.length - 2];
        if (valClsLossTrend > 0 && trainClsLossTrend < 0) {
            analysisReport += "注意：验证集分类损失(val/cls_loss)开始增加而训练集分类损失(train/cls_loss)仍在下降，可能存在过拟合。\n";
        } else if (Math.abs(valClsLossTrend) < 1e-4 && Math.abs(trainClsLossTrend) < 1e-4) {
            analysisReport += "训练和验证分类损失均停滞，建议考虑提前停止训练或调整学习率策略。\n";
        }
    }

    // mAP突然下降检测
    for (let i = 1; i < mAP50Trend.length; i++) {
        if (mAP50Trend[i] < mAP50Trend[i - 1] * 0.85) {
            analysisReport += `第${i + 1}个epoch时mAP50突然下降，可能由于学习率飙升或过度增强。建议检查学习率调度和数据增强。\n`;
            break;
        }
    }

    // 后期epoch中的mAP波动
    if (mAP50Trend.length >= 5) {
        const lateEpochs = mAP50Trend.slice(-5);
        const maxLate = Math.max(...lateEpochs);
        const minLate = Math.min(...lateEpochs);
        if (maxLate - minLate > 0.05) {
            analysisReport += "训练后期mAP出现较大波动，模型可能不稳定，建议检查数据质量，尝试减小批量大小或冻结BN层。\n";
        }
    }

    // epochs太少了
    if (data.length < 50) {
        analysisReport += "epoch（训练周期）太少，模型质量可能不高，同时我们无法进行有效的趋势分析，请增加训练轮数以获得更可靠的结果。\n";
    }

    return analysisReport;
}

function TaskResultDetailedPage({ setPageUrl, parameter }) {
    const [taskResultData, setTaskResultData] = useState({});
    const [showImageIndex, setShowImageIndex] = useState([]);
    const [analyzeTrainingResultsData, setAnalyzeTrainingResultsData] = useState("");
    const [csvData, setCsvData] = useState([]);
    const [headers, setHeaders] = useState([]);

    useEffect(() => {
        hljs.highlightAll();
    });

    useEffect(() => {
        api.get("/ITraining/getTrainingTasksHistory", {
            params: {
                taskID: parameter.taskID
            }
        })
            .then(data => {
                if (data.code == 200) {
                    const d = data.data.history.find(item => item.startedAt == Number(parameter.startedAt));
                    setTaskResultData(d);
                    console.log(d);
                } else {
                    alert(data.msg);
                }
            })
            .catch(err => {
                console.error("获取任务信息失败: ", err);
                alert(err);
            });
    }, [parameter.taskID]);

    useEffect(() => {
        api.get("/ITraining/getTrainingTaskOutputFile", {
            params: {
                taskID: parameter.taskID,
                filePath: "results.csv"
            }
        })
            .then(res => {
                if (res.code === 200 && res.data?.type === "csv") {
                    const content = res.data.content.trim();
                    const lines = content.split("\n");
                    const headerRow = lines[0].split(",");
                    const dataRows = lines.slice(1).map(line => line.split(","));

                    setHeaders(headerRow);
                    setCsvData(dataRows);

                    setAnalyzeTrainingResultsData(analyzeTrainingResults(res.data.content.trim()));
                } else {
                    console.error("不是CSV格式或请求失败");
                }
            })
            .catch(err => {
                console.error("获取results失败:", err);
            });
    }, [parameter.taskID]);

    const priorityImageFiles = [
        "confusion_matrix.png",
        "results.png",
        "BoxR_curve.png",
        "BoxP_curve.png",
        "BoxF1_curve.png",
        "BoxPR_curve.png",
    ];

    const getImageFilePriority = (fileName) => {
        const index = priorityImageFiles.indexOf(fileName);
        return index === -1 ? Infinity : index;
    };

    useEffect(() => {
        console.log(taskResultData);
    }, [taskResultData]);

    return (
        <div className="main">
            <a href="#" onClick={() => setPageUrl(`tasksDetailed?filename=${taskResultData.filename}`)} style={{ textDecoration: 'none' }}>返回</a>
            <h1 className="page-title">
                任务结果
            </h1>
            <p className="page-des">
                来自任务「{parameter.taskName || "Unknown"}」
            </p>

            <span style={{ fontSize: '18px', marginBottom: '14px' }}>
                自 <span className="task-result-detailed-time">{new Date(taskResultData.startedAt * 1000).toLocaleString()}</span> - 至 <span className="task-result-detailed-time">{new Date(taskResultData.completedAt * 1000).toLocaleString()}</span>
            </span>

            {taskResultData.outputFiles && (
                <div>
                    <div className="form-group-title">
                        <h1 className="step-tag nobg">
                            <img src={Icon_Box_seam_fill} className="icon" />
                        </h1>
                        <h1 className="title">
                            模型
                            <button className="btn sm" style={{position: 'relative', top: '-2px', marginLeft: '15px'}} onClick={() => setPageUrl(`models?type=trained`)}>进行测试</button>
                        </h1>
                    </div>

                    <div className="info-card-group">
                        {taskResultData.outputFiles
                            .filter(f => f.startsWith("weights/") || f.endsWith(".pt"))
                            .sort((a, b) => {
                                if (a === "weights/best.pt") return -1;
                                if (b === "weights/best.pt") return 1;
                                return 0;
                            })
                            .map((item, index) => (
                                <div className="info-card" key={`model_file_${index}`}>
                                    <span className="value">
                                        {item}
                                    </span>
                                    <span className="key">
                                        {getExplanation(item).map((text, idx) => (
                                            <span key={idx}>{text}</span>
                                        ))}
                                    </span>
                                </div>
                            ))}
                    </div>

                    <div className="form-group-title" style={{ marginTop: "40px" }}>
                        <h1 className="step-tag nobg">
                            <img src={Icon_Bar_chart_fill} className="icon" />
                        </h1>
                        <h1 className="title">周期指标</h1>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table className="csv-table">
                            <thead>
                                <tr>
                                    {headers.map((header, idx) => (
                                        <th key={`header-${idx}`}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {csvData.map((row, rowIndex) => (
                                    <tr key={`row-${rowIndex}`}>
                                        {row.map((cell, colIndex) => (
                                            <td key={`cell-${rowIndex}-${colIndex}`}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="tip-box" style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>
                        {analyzeTrainingResultsData}
                    </div>

                    <div className="form-group-title" style={{ marginTop: "40px" }}>
                        <h1 className="step-tag nobg">
                            <img src={Icon_Images} className="icon" />
                        </h1>
                        <h1 className="title">图像结果</h1>
                    </div>

                    <div className="info-card-group img-group">
                        {taskResultData.outputFiles
                            .filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !f.includes("labels.cache"))
                            .sort((a, b) => getImageFilePriority(a) - getImageFilePriority(b))
                            .map((item, index) => (
                                <div className="info-card" onClick={() => {
                                    setShowImageIndex(prev =>
                                        prev.includes(index)
                                            ? prev.filter(i => i !== index)
                                            : [...prev, index]
                                    );
                                }}>
                                    {showImageIndex.includes(index) ? (
                                        <ImageCard key={`image_file_${index}`} taskID={parameter.taskID} filePath={item} />
                                    ) : (
                                        <>
                                            <span className="filename">{item}</span>
                                            <span className="explanation">
                                                {getExplanation(item)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            ))}
                    </div>

                    {taskResultData.outputFiles
                        .filter(f =>
                            !(/\.(png|jpg|jpeg|csv|yaml|pt)$/i.test(f)) &&
                            !f.startsWith("weights/") &&
                            !/^(\.DS_Store|Thumbs\.db)$/i.test(f)
                        )
                        .length > 0 && (
                            <div className="form-group-title" style={{ marginTop: "40px" }}>
                                <h1 className="step-tag nobg">
                                    <img src={Icon_Files} className="icon" />
                                </h1>
                                <h1 className="title">其他文件</h1>
                            </div>
                        )}

                    {taskResultData.outputFiles
                        .filter(f =>
                            !(/\.(png|jpg|jpeg|csv|yaml|pt)$/i.test(f)) &&
                            !f.startsWith("weights/") &&
                            !/^(\.DS_Store|Thumbs\.db)$/i.test(f)
                        )
                        .map((item, index) => (
                            <div className="info-card" key={`other_file_${index}`}>
                                <span>{item}</span>
                            </div>
                        ))}
                </div>
            )}

            <div className="form-group-title" style={{ marginTop: "40px" }}>
                <h1 className="step-tag nobg">
                    <img src={Icon_Terminal_fill} className="icon" />
                </h1>
                <h1 className="title">日志</h1>
            </div>
            <div>
                <pre style={{ height: "500px", overflow: "auto" }}>
                    <code
                        className="language-yaml hljs"
                        style={{
                            fontSize: '14px',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {(taskResultData?.log || []).join('\n')}
                    </code>
                </pre>
            </div>
        </div>
    );
}

export default TaskResultDetailedPage;