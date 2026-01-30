import { api } from "../api";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import CONFIGS from "../config";

import Icon_Home from "../assets/icons/house-fill.svg";
import Icon_Dataset from "../assets/icons/database-fill.svg";
import Icon_Boxes from "../assets/icons/boxes.svg";
import Icon_Box_seam_fill from "../assets/icons/box-seam-fill.svg";
import Icon_Terminal from "../assets/icons/terminal-fill.svg";

function Navbar() {
    const [helperComponents, setHelperComponents] = useState("null");

    const navbarItem = [
        {
            id: '1',
            name: '主页',
            icon: Icon_Home,
            path: '/'
        },
        {
            id: '2',
            name: '数据集',
            icon: Icon_Dataset,
            path: '/dataset'
        },
        {
            id: '3',
            name: '训练任务',
            icon: Icon_Boxes,
            path: '/tasks'
        },
        {
            id: '4',
            name: '模型',
            icon: Icon_Box_seam_fill,
            path: '/models'
        },
        {
            id: '5',
            name: '服务',
            icon: Icon_Terminal,
            path: '/services'
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
                <NavLink
                    key={item.id}
                    to={item.path}
                    className={({ isActive }) => `navbar-item${isActive ? " clicked" : ""}`}
                    end={item.path === '/'}
                >
                    <img src={item.icon} className="icon" />
                    {item.name}
                </NavLink>
            ))}

            <p className="navbar-version">
                <button className="btn sm" onClick={() => {
                    window.open("https://github.com/Zim9729/YoloTrainingVisualizationPlatform/issues")
                }}>
                    BUG 反馈
                </button>
                <br />
                <a href="https://github.com/Zim9729/YoloTrainingVisualizationPlatform" style={{ color: 'var(--light-color)' }} target="_blank">关于</a>
                <br />
                前端版本: {CONFIGS.FRONTEND_VERSION}
                <br />
                助手版本: {helperComponents}
            </p>
        </div>
    );
}

export default Navbar;