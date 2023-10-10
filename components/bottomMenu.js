import Link from "next/link";
import Image from "next/image";

export default function BottomMenu({idx}) {

    return (
        <div className={'bottonMenu'}>
            <ul>
                <li className={idx === 0 ? 'on' : ''}>
                    <Link href={'/main'}>
                        <Image alt={'홈 아이콘'} src={`/assets/images/btn/btnMenuBtch${idx === 0 ? 'On' : ''}.svg`} width={24} height={24} />
                        <span>배치</span>
                    </Link>
                </li>
                <li className={idx === 1 ? 'on' : ''}>
                    <Link href={'/mypage/btchAdj'}>
                        <Image alt={'정산 아이콘'} src={`/assets/images/btn/btnMenuPay${idx === 1 ? 'On' : ''}.svg`} width={24} height={24} />
                        <span>정산</span>
                    </Link>
                </li>
                <li className={idx === 2 ? 'on' : ''}>
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