import {useGlobal} from "../context/globalContext";
import Image from "next/image";

export default function CmmComponent() {

    const {sAlert, setSAlert, sConfirm, setSConfirm, isLoading} = useGlobal();

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
                    <p dangerouslySetInnerHTML={{__html: !!sAlert.txt ? sAlert.txt.replace(/\n/g, '<br/>') : ''}}></p>
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
        {isLoading &&
            <div className="loader">
                <span>
                    Shopper
                    <Image alt={'로딩 이미지'} src={'/assets/images/icon/iconDistance2.svg'} width={24} height={14.8} />
                </span>
            </div>
        }
    </>
}