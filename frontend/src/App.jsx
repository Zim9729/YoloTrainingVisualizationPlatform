import { useState } from "react"

import Titlebar from "./components/Titlebar"
import Navbar from "./components/Navbar"
import Main from "./components/Main"

function App() {
    const [pageUrl, setPageUrl] = useState("home");

    return (
        <>
            <Titlebar />
            <div className="app">
                <Navbar
                    setPageUrl={(type) => {
                        setPageUrl(type);
                    }}
                />
                <Main
                    page_url={pageUrl}
                    setPageUrl={(type) => {
                        setPageUrl(type);
                    }}
                />
            </div>
        </>
    )
}

export default App
