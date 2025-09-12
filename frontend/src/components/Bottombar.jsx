import { useEffect, useState } from "react";
import { api } from "../api";

import Icon_Grid_3x3 from "../assets/icons/grid-3x3-gap-fill.svg";

function Bottombar({ setPageUrl }) {
    const [runningTasksList, setRunningTasksList] = useState([]);

    useEffect(() => {
        const fetchRunningTasks = () => {
            api.get("/ITraining/getAllRunningTasks", { params: {} })
                .then(data => {
                    console.log("获取正在运行的训练任务:", data.data.tasks);
                    setRunningTasksList(data.data.tasks);
                })
                .catch(err => {
                    console.error("获取正在运行的训练任务失败:", err);
                    alert(err);
                });
        };

        fetchRunningTasks();

        const intervalId = setInterval(fetchRunningTasks, 5000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="bottombar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                {runningTasksList.length > 0 &&
                    <span className="info-text" onClick={() => { setPageUrl("tasks") }}>
                        <img src={Icon_Grid_3x3} className="icon" style={{ marginBottom: '-3px', marginRight: '8px' }} />
                        训练中: {runningTasksList.length}
                    </span>
                }
            </div>
        </div>
    );
}

export default Bottombar;