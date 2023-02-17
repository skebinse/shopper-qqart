import Image from "next/image";
import Link from "next/link";

export default function BtchList({list, href, classNm = '', noDataTxt = '현재 접수된 배치가 없습니다.',
                                     isDtptBtn = false, isIngBtch = false, isInit}) {

    return <>
        <ul className={'btch ' + classNm}>
            {list.length === 0 && !isInit &&
                <li className={'noData'}>
                    <Image alt={'주문 X'} src={'/assets/images/img/noCart.svg'} width={234.23} height={200}/>
                    <p>{noDataTxt}</p>
                </li>
            }
            {list.map((item, idx) => (
                <li key={'btch' + idx}>
                    <Link href={href + '/' + item.ODER_USER_ID}>
                        <div className={'priceArea'}>
                            <p>{item.DELY_AMT}원</p>
                            <Image alt={'상점 이미지'} src={item.SHOP_RRSN_ATCH_FILE_LIST} width={40} height={40} />
                        </div>
                        <div className={'delyArea'}>
                            <div>
                                <Image alt={'배달거리 이미지'} src={'/assets/images/icon/iconDistance.svg'} width={24} height={14.8} />
                                <span>{item.SLIN_DTC}Km</span>
                            </div>
                            <div>
                                <Image alt={'상품 이미지'} src={'/assets/images/icon/iconProduct.svg'} width={17} height={18.4} />
                                <span>{item.ODER_KD === 'PIUP' ? '픽업' : item.PROD_CNT + '개 상품'}</span>
                            </div>
                            {!!item.ODER_RPRE_NO &&
                                <div className={'orderNo'}>
                                    <Image alt={'주문 정보'} src={'/assets/images/icon/iconInfo.svg'} width={17} height={18.4} />
                                    <span>{item.ODER_RPRE_NO}</span>
                                </div>
                            }
                        </div>
                        <p>{item.ODER_DELY_FULL_ADDR}</p>
                        <h5>
                            <Image alt={'주문 정보'} src={'/assets/images/icon/iconStore.png'} width={20} height={20} />
                            {item.SHOP_NM}
                        </h5>
                        <p>{item.SHOP_FULL_ADDR}</p>
                        {isDtptBtn &&
                            <button type={'button'} className={'button'}>상세보기</button>
                        }
                    </Link>
                </li>
            ))}
        </ul>
    </>
}