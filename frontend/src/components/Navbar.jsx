import { api } from "../api";
import { useState, useEffect } from "react";
import CONFIGS from "../config";

function Navbar({ setPageUrl }) {
    const [helperComponents, setHelperComponents] = useState("null");

    const navbarItem = [
        {
            id: '1',
            name: '主页',
            pageUrl: 'home'
        },
        {
            id: '2',
            name: '数据集',
            pageUrl: 'dataset'
        },
        {
            id: '3',
            name: '训练任务',
            pageUrl: 'tasks'
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
                    {item.name}
                </div>
            ))}

            <p className="navbar-version">
                前端版本: {CONFIGS.FRONTEND_VERSION}
                <br />
                助手版本: {helperComponents}
            </p>
        </div>
    );
}

export default Navbar;