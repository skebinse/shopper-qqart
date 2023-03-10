import {useRouter} from "next/navigation";
import Image from "next/image";

export default function HeadTitle({title, type, callbackClose, children}) {

    const router = useRouter();

    return (
        <div className={'headTitle'}>
            <h3 className={type}>{title}</h3>
            {!type &&
                <Image alt={'뒤로가기'} src={'/assets/images/btn/btnBack.svg'} width={35} height={35} onClick={() => {
                    if(callbackClose) {
                        callbackClose();
                    } else {
                        router.back();
                    }
                }} />
            }
            {type === 'close' &&
                <Image alt={'닫기'} src={'/assets/images/icon/iconClose.svg'} width={24} height={24} onClick={callbackClose} />
            }
            {children}
        </div>
    );
}