import Image from "next/image";
import Link from "next/link";
import styles from "../styles/index.module.css";
import React from "react";

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
                            <p>
                                {item.DELY_AMT}원
                                {item.ODER_DRC_LDTN_YN === 'N' &&
                                    <span>(카드 단말기 필요)</span>
                                }
                            </p>
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
            {/*<li className={styles.info}>*/}
            {/*    <div>*/}
            {/*        <div>*/}
            {/*            <span>상호: (주) 베리비지비</span>*/}
            {/*            <span>대표 : 김채영</span>*/}
            {/*            <span>사업장주소: 서울특별시 송파구 송이로 242, 602호</span>*/}
            {/*            <span>사업자등록번호 : 664-88-02585</span>*/}
            {/*            <span>대표전화번호: 1855-0582</span>*/}
            {/*        </div>*/}
            {/*        <div>*/}
            {/*            <span>고객센터 운영시간 : 09:00 ~ 21:00(연중무휴)</span>*/}
            {/*            <span>대표 이메일: <a href="mailto:qqcart.shop@gmail.com">qqcart.shop@gmail.com</a></span>*/}
            {/*        </div>*/}
            {/*        <div>*/}
            {/*            <span>2023 © <em>퀵퀵카트 쇼퍼</em> All Rights Reserved.</span>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</li>*/}
        </ul>
    </>
}