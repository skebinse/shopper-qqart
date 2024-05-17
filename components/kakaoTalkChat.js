import {useRouter} from "next/navigation";
import Image from "next/image";
import React from "react";

export default function KakaoTalkChat({title, type, callbackClose, children}) {

    const router = useRouter();

    const onClickHandler = () => {

        window.open('http://pf.kakao.com/_haBuxj/chat', '_system');
    }

    return (
        <></>
        // <div className={'divKakaoTalkChat'}>
        //     <a onClick={onClickHandler} target={'_system'} className={'link'}>
        //         <Image src={'/assets/images/img/kakaoTalk.png'} alt={'카카오톡 이미지'} width={58} height={58} />
        //     </a>
        // </div>
)
    ;
}