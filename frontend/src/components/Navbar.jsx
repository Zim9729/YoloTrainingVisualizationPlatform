import { api } from "../api";
import { useState, useEffect } from "react";
import CONFIGS from "../config";

import Icon_Home from "../assets/icons/house-fill.svg";
import Icon_Dataset from "../assets/icons/database-fill.svg";
import Icon_Boxes from "../assets/icons/boxes.svg";
import Icon_Box_seam_fill from "../assets/icons/box-seam-fill.svg";
import Icon_Gear_fill from "../assets/icons/gear-fill.svg";

function Navbar({ setPageUrl }) {
    const [helperComponents, setHelperComponents] = useState("null");

    const navbarItem = [
        {
            id: '1',
            name: '主页',
            icon: Icon_Home,
            pageUrl: 'home'
        },
        {
            id: '2',
            name: '数据集',
            icon: Icon_Dataset,
            pageUrl: 'dataset'
        },
        {
            id: '3',
            name: '训练任务',
            icon: Icon_Boxes,
            pageUrl: 'tasks'
        },
        {
            id: '4',
            name: '模型',
            icon: Icon_Box_seam_fill,
            pageUrl: 'models'
        },
        {
            id: '5',
            name: '设置',
            icon: Icon_Gear_fill,
            pageUrl: 'settings'
        }
    ]

    useEffect(() => {
        api.get("/info", { params: {} })
            .then(data => {
                setHelperComponents(data.data.version);
                console.log("助手版本:", data.data.version);
            })
            .catch(err => {
                console.error("获取助手版本失败:", err);
            });
    }, []);

    return (
        <div className="navbar">
            {navbarItem.map((item) => (
                <div
                    key={item.id}
                    className="navbar-item"
                    onClick={() => setPageUrl(item.pageUrl)}
                >
                    <img src={item.icon} className="icon" />
                    {item.name}
                </div>
            ))}

            <p className="navbar-version">
                <a href="https://github.com/chzane/YoloTrainingVisualizationPlatform" style={{ color: 'var(--light-color)' }} target="_blank">关于</a>
                <br />
                前端版本: {CONFIGS.FRONTEND_VERSION}
                <br />
                助手版本: {helperComponents}
            </p>
        </div>
    );
}

export default Navbar;