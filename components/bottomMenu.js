import Link from "next/link";
import Image from "next/image";

export default function BottomMenu({idx}) {

    return (
        <div className={'bottonMenu'}>
            <ul>
                <li className={idx === 0 ? 'on' : ''}>
                    <Link href={'/'}>
                        <Image alt={'홈 아이콘'} src={`/assets/images/icon/iconHome${idx === 0 ? 'On' : 'Off'}.svg`} width={17} height={17} />
                        <span>홈</span>
                    </Link>
                </li>
                <li className={idx === 1 ? 'on' : ''}>
                    <Link href={'/mypage'}>
                        <Image alt={'마이페이지 아이콘'} src={`/assets/images/icon/iconMypage${idx === 1 ? 'On' : 'Off'}.svg`} width={17} height={17} />
                        <span>마이페이지</span>
                    </Link>
                </li>
            </ul>
        </div>
    );
}