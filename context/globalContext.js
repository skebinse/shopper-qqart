import {createContext, useContext, useEffect, useState} from "react";

const GlobalContext = createContext();

export function GlobalProvider({children}) {

    const [isLoading, setIsLoading] = useState(false);
    const [sAlert, setSAlert] = useState({
        show: false,
        title: '알림',
        txt: '',
        callback: null,
    });
    const [sConfirm, setSConfirm] = useState({
        show: false,
        title: '확인',
        txt: '',
        callbackOk: null,
        callbackCancel: null,
    });

    return (
        <GlobalContext.Provider value={{sAlert, setSAlert, sConfirm, setSConfirm, isLoading, setIsLoading}}>
            {children}
        </GlobalContext.Provider>
    )
}

export const useGlobal = () => useContext(GlobalContext);