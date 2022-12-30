import {useGlobal} from "../context/globalContext";

export default function CmmComponent() {

    const {sAlert, setSAlert, sConfirm, setSConfirm} = useGlobal();

    /**
     * Alert 확인
     */
    const alertOk = () => {

        setSAlert(prevState => ({...prevState, show: false, title: '알림', txt: ''}));
        !!sAlert.callback && sAlert.callback();
    };

    /**
     * Confirm 확인
     * @param isConfirm
     */
    const confirmClick = isConfirm => {

        if(!!isConfirm) {

            !!sConfirm.callbackOk && sConfirm.callbackOk();
            setSConfirm(prevState => ({...prevState, show: false, title: '알림', txt: ''}));
        } else {

            !!sConfirm.callbackCancel && sConfirm.callbackCancel();
            setSConfirm(prevState => ({...prevState, show: false, title: '확인', txt: ''}));
        }
    };

    return <>
        {sAlert.show &&
            <div className={'alertArea'}>
                <div>
                    {sAlert.title &&
                        <h3>{sAlert.title}</h3>
                    }
                    <p dangerouslySetInnerHTML={{__html: sAlert.txt.replace(/\n/g, '<br/>')}}></p>
                    <button className={'button'} type={"button"} onClick={alertOk}>확인</button>
                </div>
            </div>
        }
        {sConfirm.show &&
            <div className={'confirmArea'}>
                <div>
                    {sConfirm.title &&
                        <h3>{sConfirm.title}</h3>
                    }
                    <p dangerouslySetInnerHTML={{__html: sConfirm.txt.replace(/\n/g, '<br/>')}}></p>
                    <div>
                        <button className={'button white mr16'} type={"button"}  onClick={() => confirmClick(false)}>취소</button>
                        <button className={'button'} type={"button"} onClick={() => confirmClick(true)}>확인</button>
                    </div>
                </div>
            </div>
        }
    </>
}