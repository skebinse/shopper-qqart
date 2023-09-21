import Image from "next/image";
import Link from "next/link";
import styles from "../styles/index.module.css";
import React, {useEffect} from "react";
import cmm from "../js/common";

export default function  BtchList({list, href, classNm = '', noDataTxt = '현재 접수된 배치가 없습니다.',
                                     isDtptBtn = false, isIngBtch = false, isInit}) {

    /**
     * 예약 태그 생성
     * @param item
     */
    const createTagResv = item => {

        let oderDelySlctVal;
        switch (item.ODER_DELY_SLCT_VAL) {
            case 'imm' : oderDelySlctVal = '즉시 배달'; break;
            case '2Hour' : oderDelySlctVal = '배달시간 : 2~3시간 내'; break;
            case 'today' : oderDelySlctVal = '배달시간 : 오늘 안에만'; break;
            case 'resv' :
                oderDelySlctVal = `배달시간 : ${item.ODER_DELY_YMD + ' ' + item.ODER_DELY_HH}`;
                break;
        }

        return oderDelySlctVal;
    };

    return <>
        <ul className={'btch ' + classNm}>
            {list.length === 0 && !isInit &&
                <li className={'noData'}>
                    <Image alt={'주문 X'} src={'/assets/images/img/noCart.svg'} width={234.23} height={200}/>
                    <p>{noDataTxt}</p>
                </li>
            }
            {list.map((item, idx) => (
                <li key={'btch' + idx} className={[
                    item.BTCH_ODER_PGRS_MI >= 120 ? 'hhWr hhExcs' :
                        (((item.BTCH_ODER_PGRS_MI >= 90)) ? 'hhWr' : ''),
                    isIngBtch ? 'btchIng' : 'btchWait'
                ].join(' ')
                }>
                    <Link href={href + '/' + item.ODER_USER_ID}>
                        <div className={'priceArea'}>
                            <div>
                                <p>
                                    {item.DELY_AMT}원
                                    {(!isIngBtch && item.SHPR_ADJ_POIN) > 0 &&
                                        <span className={'point'}>+{cmm.util.comma(item.SHPR_ADJ_POIN)}P</span>
                                    }
                                    {item.ODER_DRC_LDTN_YN === 'N' && item.ODER_DRC_LDTN_AMT === 0 &&
                                        <span>카드 단말기</span>
                                    }
                                    {item.ODER_DRC_LDTN_YN === 'N' && item.ODER_DRC_LDTN_AMT > 0 &&
                                        <span className={'drcLdtn'}>직접 결제</span>
                                    }
                                </p>
                                <Image alt={'상점 이미지'} src={item.SHOP_RRSN_ATCH_FILE_LIST} width={40} height={40} />
                            </div>
                            {(isIngBtch && item.SHPR_ADJ_POIN) > 0 &&
                                <span className={'point'}>+{cmm.util.comma(item.SHPR_ADJ_POIN)}P</span>
                            }
                        </div>
                        {!!item.ODER_RPRE_NO &&
                            <p>
                                주문번호: <em>{item.ODER_RPRE_NO.length === 11 ? cmm.util.getNumber(item.ODER_RPRE_NO.substring(6)) : item.ODER_RPRE_NO}</em>
                            </p>
                        }
                        <div className={'delyArea'}>
                            <div>
                                <Image alt={'배달거리 이미지'} src={`/assets/images/icon/iconDistance${item.BTCH_ODER_PGRS_MI >= 90 ? 'W' : ''}.svg`} width={24} height={14.8} />
                                <span>{item.ODER_DELY_DTC}Km</span>
                            </div>
                            <div>
                                <Image alt={'상품 이미지'} src={`/assets/images/icon/iconProduct${item.BTCH_ODER_PGRS_MI >= 90 ? 'W' : ''}.svg`} width={17} height={18.4} />
                                <span>{item.ODER_KD === 'PIUP' ? '픽업' : item.PROD_CNT + '개 상품'}</span>
                            </div>
                        </div>
                        <p>{item.ODER_DELY_FULL_ADDR}</p>
                        {item.ODER_DELY_SLCT_VAL !== 'imm' &&
                            <p>{createTagResv(item)}</p>
                        }
                        <div className={'storeArea'}>
                            <h5>
                                {item.SHOP_NM}
                            </h5>
                            <p>{item.SHOP_FULL_ADDR}</p>
                            {(!!isIngBtch && item.BTCH_ODER_PGRS_MI >= 90) &&
                                <div className={'piupRemMi'}>
                                    <Image alt={'주문 정보'} src={'/assets/images/icon/iconWarningW.svg'} width={17} height={17} />
                                    {item.BTCH_ODER_PGRS_MI >= 120 &&
                                        <>
                                            {cmm.date.getMmToHhMm(item.BTCH_ODER_PGRS_MI - 120)} 지남
                                        </>
                                    }
                                    {item.BTCH_ODER_PGRS_MI < 120 &&
                                        <>
                                            {cmm.date.getMmToHhMm(120 - item.BTCH_ODER_PGRS_MI)} 남음
                                        </>
                                    }
                                </div>
                            }
                        </div>
                        {isDtptBtn &&
                            <button type={'button'} className={'button'}>상세보기</button>
                        }
                    </Link>
                </li>
            ))}
        </ul>
    </>
}