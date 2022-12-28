import {createContext, useContext, useState} from "react";

const GlobalContext = createContext();

export function GlobalProvider({children}) {

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
        <GlobalContext.Provider value={{sAlert, setSAlert, sConfirm, setSConfirm}}>
            {children}
        </GlobalContext.Provider>
    )
}

export const useGlobal = () => useContext(GlobalContext);