function Navbar({ setPageUrl }) {
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
                前端版本: 1.0.0
                <br />
                助手版本: 1.0.0
            </p>
        </div>
    );
}

export default Navbar;