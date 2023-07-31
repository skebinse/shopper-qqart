import React, {useEffect, useState} from 'react';
import HeadTitle from "../../../components/headTitle";
import styles from "../../../styles/btch.module.css";
import {useRouter} from "next/router";
import cmm from "../../../js/common";
import Image from "next/image";
import useCommon from "../../../hooks/useCommon";

export default function LdtnOderUserId() {

    const {goPage} = useCommon();
    const router = useRouter();
    const {ldtnOderUserId} = router.query;
    const [ldtnAmt, setLdtnAmt] = useState('');
    const [ldtnInfo, setLdtnInfo] = useState({
        orderId: cmm.util.guid() + '-' + ldtnOderUserId,
        amount: 0,
        cardNumberTxt: '',
        cardExpirationTxt: '',
        customerIdentityNumber: '',
    });

    useEffect(() => {

        cmm.ajax({
            url: `/api/btch/ldtn/${ldtnOderUserId}`,
            success: res => {

                const item = (!!res && res.length > 0) ? res[0] : {};

                if(item.ODER_CARD_DRC_LDTN_CPL_YN === 'Y') {

                    cmm.alert('이미 결제가 완료되었습니다.');
                    router.back();
                } else {

                    setLdtnAmt(cmm.util.comma(item.ODER_DRC_LDTN_AMT));
                    setLdtnInfo(prevState => ({...prevState, orderName: `${item.SHOP_NM} 스토어 ${item.SHPR_NCNM} 쇼퍼 결제`, amount: item.ODER_DRC_LDTN_AMT}));
                }
            },
        });
    }, []);

    /**
     * 결제 내역 등록
     */
    const callInsLdtnHity = res => {

        cmm.ajax({
            url: `/api/btch/ldtn/ldtnHity`,
            isLoaing: false,
            data: {
                oderUserId: ldtnOderUserId,
                orderId: ldtnInfo.orderId,
                failCd: !!res.code ? res.code : '',
                failText: !!res.message ? res.message : '',
                amt: ldtnInfo.amount,
                paymentKey: res.paymentKey,
                ldtnInfo: JSON.stringify(res),
            },
            success: res => {
            },
        });
    }

    /**
     * 결제
     */
    const ldtnHandler = () => {

        cmm.confirm('결제하시겠습니까?', () => {

            cmm.ajax({
                url: 'https://api.tosspayments.com/v1/payments/key-in',
                dataType: 'json',
                headers: {
                    Authorization: 'Basic ' + btoa(process.env.NEXT_PUBLIC_API_PAY_SECRET + ':'),
                },
                isExtr: true,
                data: ldtnInfo,
                success: res => {
                    console.log(res);

                    // 결제 내역 등록
                    callInsLdtnHity(res);

                    if(!!res.code) {

                        cmm.alert(res.message);
                    } else {

                        cmm.ajax({
                            url: `/api/btch/ldtn/ldtnPgrs`,
                            data: {
                                oderUserId: ldtnOderUserId,
                            },
                            success: res => {

                                goPage('/btch/ing/' + ldtnOderUserId);
                            },
                        });
                    }
                }
            });
        });
    }

    /**
     * 카드 유효기간 변경
     * @param e
     */
    const cardVldtPeriChange = e => {

        const value = e.target.value.replace('/', '');
        let cardExpirationMonth = '';
        let cardExpirationYear = '';

        if(value.length > 2) {

            e.target.value = value.substring(0, 2) + '/' + value.substring(2);

            if(value.length === 4) {

                cardExpirationMonth = value.substring(0, 2);
                cardExpirationYear = value.substring(2);
            }
        } else {

            e.target.value = value;
        }

        setLdtnInfo(prevState => ({...prevState, cardExpirationMonth, cardExpirationYear, cardExpirationTxt: e.target.value}));
    };

    /**
     * 카드변호 변경
     * @param e
     */
    const cardNumChange = e => {

        const value = e.target.value.replace(/-/g, '');
        let txt = '';
        let cardNumber = '';

        for(let i = 0; i < value.length / 4; i++) {

            if(value.length > ((i + 1) * 4)) {
                txt += value.substring(i * 4, (i + 1) * 4) + '-';
            } else {
                txt += value.substring(i * 4);
            }
        }

        if(value.length === 16) {
            cardNumber = value;
        }

        setLdtnInfo(prevState => ({...prevState, cardNumber, cardNumberTxt: !!txt ? txt : value}));
    };

    return (
        <div className={styles.ldtn}>
            <HeadTitle title={'신용카드 결제'} />
            <div className={styles.amtDiv}>
                <h5>결제하실 금액</h5>
                <p>
                    <Image alt={'금액'} src={'/assets/images/icon/iconAmt.svg'} width={24} height={24} />
                    {ldtnAmt}원
                </p>
            </div>
            <h4>결제 정보 입력</h4>
            <ul className={'inputUl'}>
                <li>
                    <label>
                        카드번호
                    </label>
                    <div>
                        <input type="text" value={ldtnInfo.cardNumberTxt} onChange={cardNumChange} placeholder="0000-0000-0000-0000" maxLength={19} />
                    </div>
                </li>
                <li>
                    <label>
                        유효기간(MM/YY)
                    </label>
                    <div>
                        <input type="tel" value={ldtnInfo.cardExpirationTxt} onChange={cardVldtPeriChange} placeholder="MM/YY" maxLength={5}/>
                    </div>
                </li>
                <li>
                    <label>
                        생년월일(YYMMDD)
                    </label>
                    <div>
                        <input type="tel" value={ldtnInfo.customerIdentityNumber} onChange={e => setLdtnInfo(prevState => ({...prevState, customerIdentityNumber: e.target.value}))} placeholder="생년월일 6자리를 입력해 주세요." maxLength={6} />
                    </div>
                </li>
            </ul>
            <div className={'btnBottomArea'}>
                <button type={'button'} className={'button'} onClick={ldtnHandler} >결제</button>
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {

    return {
        props: {},
    }
}