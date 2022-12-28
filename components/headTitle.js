import {useRouter} from "next/navigation";

export default function HeadTitle({title, type, callbackClose}) {

    const router = useRouter();

    return (
        <div className={'headTitle'}>
            <h3>{title}</h3>
            {!type &&
                <img src="/assets/images/btn/btnBack.svg" onClick={() => router.back()}/>
            }
            {type === 'close' &&
                <img src="/assets/images/icon/iconClose.svg" onClick={callbackClose}/>
            }
        </div>
    );
}