import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

function LabelStudioImportPage({ setPageUrl, parameter }) {
  const [baseUrl, setBaseUrl] = useState(parameter.base_url || "http://10.10.10.96:8080");
  const [token, setToken] = useState(parameter.token || "");

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [name, setName] = useState("");
  const [version, setVersion] = useState("v1.0.0");
  const [description, setDescription] = useState("");

  const [trainSplit, setTrainSplit] = useState(0.8);
  const [valSplit, setValSplit] = useState(0.2);
  const [testSplit, setTestSplit] = useState(0.0);
  const [downloadImages, setDownloadImages] = useState(true);
  const [classNamesText, setClassNamesText] = useState("");

  const sumSplits = useMemo(() => (
    Number(trainSplit) + Number(valSplit) + Number(testSplit)
  ).toFixed(2), [trainSplit, valSplit, testSplit]);

  useEffect(() => {
    hljs.highlightAll();
  }, []);

  const loadProjects = async () => {
    if (!baseUrl) {
      alert("请填写 Label Studio base_url");
      return;
    }
    setLoadingProjects(true);
    try {
      const res = await api.get("/IDataset/listLabelStudioProjects", { params: { base_url: baseUrl, token } });
      setProjects(res?.data?.projects || []);
      if ((res?.data?.projects || []).length === 0) {
        alert("未获取到项目，请确认 base_url/token 是否正确，或项目是否存在。");
      }
    } catch (e) {
      console.error(e);
      alert("获取项目失败：" + e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const submitBuild = async () => {
    if (!baseUrl || !selectedProjectId || !name || !version) {
      alert("请完整填写 base_url、项目、数据集名称与版本");
      return;
    }
    const splits = [Number(trainSplit), Number(valSplit), Number(testSplit)];
    const sum = splits.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 1e-6) {
      alert("train/val/test 比例之和必须为 1.0");
      return;
    }

    let class_names = undefined;
    if (classNamesText.trim()) {
      class_names = classNamesText.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    }

    try {
      const res = await api.post("/IDataset/buildDatasetFromLabelStudio", {
        data: {
          base_url: baseUrl,
          token,
          project_id: Number(selectedProjectId),
          name,
          version,
          description,
          exportType: "CSV",
          splits,
          seed: 42,
          download_images: downloadImages,
          class_names,
        },
      });
      alert(res.msg || "构建成功");
      if (res.code === 200) {
        setPageUrl("dataset");
      }
    } catch (e) {
      console.error(e);
      alert("构建失败：" + e);
    }
  };

  return (
    <div className="main">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">从 Label Studio 导入</h1>
        <p className="page-des">连接你的 Label Studio，选择项目，一键构建 YOLO 数据集。</p>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h2 className="title" style={{ marginBottom: '16px' }}>连接 Label Studio</h2>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>Base URL</label>
          <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="例如：http://127.0.0.1:8080" />
        </div>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label>Token（可选）</label>
          <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="如：Token xxxxx" />
        </div>
        <button className="btn sm" onClick={loadProjects} disabled={loadingProjects} style={{ marginBottom: '16px' }}>
          {loadingProjects ? "正在获取项目..." : "获取项目列表"}
        </button>

        {projects.length > 0 && (
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>选择项目</label>
            <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
              <option value="">请选择项目</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title} (ID: {p.id})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h2 className="title" style={{ marginBottom: '16px' }}>数据集配置</h2>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>数据集名称</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="请输入数据集名称" />
        </div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>版本</label>
          <input type="text" value={version} onChange={e => setVersion(e.target.value)} placeholder="如：v1.0.0" />
        </div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>描述（可选）</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="请输入描述" />
        </div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ marginBottom: '8px', display: 'block' }}>数据集划分（和为 1.0） 当前合计：{sumSplits}</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <span style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>train</span>
              <input type="number" step="0.01" min="0" max="1" value={trainSplit} onChange={e => setTrainSplit(e.target.value)} />
            </div>
            <div>
              <span style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>val</span>
              <input type="number" step="0.01" min="0" max="1" value={valSplit} onChange={e => setValSplit(e.target.value)} />
            </div>
            <div>
              <span style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>test</span>
              <input type="number" step="0.01" min="0" max="1" value={testSplit} onChange={e => setTestSplit(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>
            <input type="checkbox" checked={downloadImages} onChange={e => setDownloadImages(e.target.checked)} style={{ marginRight: '8px' }} /> 下载图片
          </label>
        </div>
        <div className="form-group">
          <label>类别名称（可选，逗号或换行分隔）</label>
          <textarea value={classNamesText} onChange={e => setClassNamesText(e.target.value)} placeholder={"如：person,car,bike 或每行一个"} />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <button className="btn sm" onClick={submitBuild} style={{ marginRight: '12px' }}>
          开始构建
        </button>
        <button className="btn sm" onClick={() => setPageUrl('dataset')}>
          返回数据集
        </button>
      </div>

      <div className="tip-box" style={{ marginTop: '20px' }}>
        <p style={{ marginBottom: '8px' }}>提示：</p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li style={{ marginBottom: '4px' }}>我们不会在前端存储你的 Token；仅在本次请求中使用。</li>
          <li style={{ marginBottom: '4px' }}>若不提供类别名称，将自动根据标注推断。</li>
          <li>构建完成后可在"数据集"列表中查看并用于训练任务。</li>
        </ul>
      </div>
    </div>
  );
}

export default LabelStudioImportPage;
