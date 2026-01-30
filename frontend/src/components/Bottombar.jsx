import { useNavigate } from "react-router-dom";
import { useRunningTasks } from "../contexts/TaskContext";
import Icon_Grid_3x3 from "../assets/icons/grid-3x3-gap-fill.svg";

function Bottombar() {
    const { runningTasksCount } = useRunningTasks();
    const navigate = useNavigate();

    return (
        <div className="bottombar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                {runningTasksCount > 0 &&
                    <span className="info-text" onClick={() => { navigate("/tasks") }}>
                        <img src={Icon_Grid_3x3} className="icon" style={{ marginBottom: '-3px', marginRight: '8px' }} />
                        训练中: {runningTasksCount}
                    </span>
                }
            </div>
        </div>
    );
}

export default Bottombar;