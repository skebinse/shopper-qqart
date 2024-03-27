import Link from "next/link";
import Image from "next/image";
import cmm from "../js/common";
import {useEffect, useState} from "react";

export default function BottomMenu({idx}) {

    const [display, setDisplay] = useState('list-item');

    useEffect(() => {

        // 업체 쇼퍼일 경우
        if(cmm.getLoginInfo('SHPR_GRD_CD') === 'ETPS') {

            setDisplay('none');
        }
    }, []);

    return (
        <div className={'bottonMenu'}>
            <ul>
                <li className={idx === 0 ? 'on' : ''}>
                    <Link href={'/'}>
                        <Image alt={'홈 아이콘'} src={`/assets/images/btn/btnMenuBtch${idx === 0 ? 'On' : ''}.svg`} width={24} height={24} />
                        <span>배치</span>
                    </Link>
                </li>
                <li className={idx === 1 ? 'on' : ''} style={{display: display}}>
                    <Link href={'/mypage/btchAdj'}>
                        <div className={'divAdjNtfy'}>
                            미정산
                        </div>
                        <Image alt={'정산 아이콘'} src={`/assets/images/btn/btnMenuPay${idx === 1 ? 'On' : ''}.svg`}
                               width={24} height={24}/>
                        <span>정산</span>
                    </Link>
                </li>
                <li className={idx === 2 ? 'on' : ''} style={{display: display}}>
                    <Link href={'/mag/annc'}>
                    <Image alt={'공지 아이콘'} src={`/assets/images/btn/btnMenuAnnc${idx === 2 ? 'On' : ''}.svg`} width={24} height={24} />
                        <span>공지</span>
                    </Link>
                </li>
                <li className={idx === 3 ? 'on' : ''}>
                    <Link href={'/mypage'}>
                        <Image alt={'마이페이지 아이콘'} src={`/assets/images/btn/btnMenuMypage${idx === 3 ? 'On' : ''}.svg`} width={24} height={24} />
                        <span>마이페이지</span>
                    </Link>
                </li>
            </ul>
        </div>
    );
}