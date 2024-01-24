import Image from "next/image";
import Link from "next/link";
import styles from "../styles/index.module.css";
import React, {useEffect, useRef, useState} from "react";
import cmm from "../js/common";
import useShopS3Upload from "../hooks/useShopS3Upload";

export default function  BtchList({ulRef, list, href, classNm = '', noDataTxt = '현재 접수된 배치가 없습니다.',
                                     isDtptBtn = false, isIngBtch = false, isInit, reflashHandler, filter}) {

    const [atchImgList, setAtchImgList] = useState([]);
    const [atchPrvImgList, setAtchPrvImgList] = useState([]);
    const [btchList, setBtchList] = useState([]);
    const inpFile = useRef([]);
    const selectItem = useRef(null);
    const shopS3Upload = useShopS3Upload();

    useEffect(() => {

        setBtchList(list);
        if(isIngBtch) {
            setAtchImgList([...list.map(() => [])]);
            setAtchPrvImgList([...list.map(() => [])]);
        }
    }, [list]);

    /**
     * 배치 리스트 필터
     */
    useEffect(() => {

        if(!!filter && (!!filter.mapShopId || !!filter.mapPsitInfo)) {

            // 상점일 경우
            if(!!filter.mapShopId) {

                setBtchList(list.filter(item => item.SHOP_ID === filter.mapShopId && (item.ODER_PGRS_STAT === '02' || item.ODER_PGRS_STAT === '03')));
            // 단일 배치일 경우
            } else if(!!filter.mapPsitInfo) {

                const psitInfo = filter.mapPsitInfo.split(',');
                setBtchList(list.filter(item => item.ODER_DELY_ADDR_LAT === psitInfo[0] && item.ODER_DELY_ADDR_LOT === psitInfo[1] && item.ODER_PGRS_STAT === '05'));
            }
        } else {

            setBtchList(list);
        }
    }, [filter]);

    /**
     * 예약 태그 생성
     * @param item
     */
    const createTagResv = item => {

        let oderDelySlctVal;
        switch (item.ODER_DELY_SLCT_VAL) {
            case 'imm' : oderDelySlctVal = '즉시 배달'; break;
            case '2Hour' : oderDelySlctVal = '예약 : 2~3시간 내'; break;
            case 'today' : oderDelySlctVal = '예약 : 오늘 안에만'; break;
            case 'resv' :
                oderDelySlctVal = `예약 : ${item.ODER_DELY_YMD + ' ' + item.ODER_DELY_HH}`;
                break;
        }

        return oderDelySlctVal;
    };

    /**
     * 영수증 이미지 변경
     * @param e
     */
    const fileAtchChage = (e, item, idx) => {

        if(e.target.files.length > 0) {

            selectItem.current = {
                item,
                idx
            };
            let fileIdx = 0, uploadFile;
            cmm.loading(true);
            for(let i = 0; i < e.target.files.length; i++) {

                uploadFile = e.target.files[i];
                // 썸네일
                cmm.util.getThumbFile({file: uploadFile, maxSize: 1024, type: uploadFile.type}).then(imgData => {
                    fileIdx++;
                    setAtchPrvImgList(prevState => prevState.map((img, imgIdx)  => idx === imgIdx ? [...img, window.URL.createObjectURL(imgData.blob)] : img));
                    setAtchImgList(prevState => prevState.map((img, imgIdx)  => idx === imgIdx ? [...img, imgData.blob] : img));

                    if(fileIdx === e.target.files.length) {

                        e.target.value = '';
                        cmm.loading(false);
                    }
                });
            }
        }
    };

    useEffect(() => {

        // 배달 시작일 경우
        if(!!selectItem.current && selectItem.current.item.ODER_PGRS_STAT === '03') {

            // 배치 버튼 클릭
            btchBtnClickHandler(selectItem.current.item, selectItem.current.idx);
        }

        selectItem.current = null;

    }, [atchImgList]);

    /**
     * 첨부 이미지 삭제
     *
     * @param idx
     */
    const imageAtchDelHandler = (idx, imgIdx) => {

        let list = [...atchPrvImgList];
        if(imgIdx === 'all') {

            list[idx] = [];
        } else {

            list[idx] = list[idx].filter((value, _imgIdx) => _imgIdx !== imgIdx);
        }
        setAtchPrvImgList(list);

        list = [...atchImgList];
        if(imgIdx === 'all') {

            list[idx] = [];
        } else {

            list[idx] = list[idx].filter((value, _imgIdx) => _imgIdx !== imgIdx);
        }
        setAtchImgList(list);
    };

    /**
     * 배치 버튼 클릭
     *
     * @param idx
     */
    const btchBtnClickHandler = (item, idx) => {

        // 배치 수락
        if(item.ODER_PGRS_STAT === '02') {

            let options = `<option value="15">15분</option><option value="30" selected >30분</option>`;

            cmm.confirm(`배치를 수락하시려면\n 픽업예상 시간을 선택해 주세요.
                        <select id="oderPiupFrcsMi" style="width: 100%;margin-top: 16px;">
                            ${options}
                        </select>`, () => {

                cmm.ajax({
                    url: '/api/btch/btchAcp',
                    data: {
                        oderUserId: item.ODER_USER_ID,
                        oderPiupFrcsMi: oderPiupFrcsMi.value
                    },
                    success: res => {

                        cmm.alert('배치 수락이 완료되었습니다.', () => {

                            reflashHandler && reflashHandler('배치수락');
                        });
                    }, error: res => {

                        if(res.resultMsg) {

                            cmm.alert(res.resultMsg, () => {

                                reflashHandler && reflashHandler('배치실패');
                            }, '실패');
                        }
                    },
                });
            }, null, '배치 수락');
        } else {

            if(!atchPrvImgList[idx] || atchPrvImgList[idx].length === 0) {

                inpFile.current[idx].click();
            } else {

                // 배달 시작
                if(item.ODER_PGRS_STAT === '03' || item.ODER_PGRS_STAT === '04') {

                    let msg = item.ODER_PGRS_STAT === '03' ? '스토어에 도착하셨나요?\n장보기를 시작하시겠습니까?' : '결제를 완료하였나요?\n지금부터 배달을 시작하시겠습니까?';
                    let title = item.ODER_PGRS_STAT === '03' ? '장보기 시작' : '배달 시작';
                    // 픽업일 경우
                    if (item.ODER_PGRS_STAT === '03' && item.ODER_KD === 'PIUP') {
                        msg = '스토어에 도착하셨나요?\n지금부터 배달을 시작하시겠습니까?';
                        title = '배달 시작';

                        if(!!item.ODER_DELY_ARTG) {

                            const check1 = item.ODER_DELY_ARTG.indexOf('계란') > -1;
                            const check2 = item.ODER_DELY_ARTG.indexOf('파손주의') > -1;
                            if(check1 || check2) {

                                msg += '\n\n';
                                msg += '<span style="color: red">' + (check1 ? '계란\n' : '') + '</span>';
                                msg += '파.손.주.의 물품이 있습니다!!!\n\n배달 전 파손여부를 확인 후\n주의해서 배달해주시기 바랍니다.\n\n' ;
                                msg += '<input type="checkbox" id="confirmChk" /><label for="confirmChk">네, 주의해서 배달하겠습니다.</label>' ;
                                msg += '<span id="confirmVali">체크 후 진행 가능합니다.</span>' ;
                            }
                        }
                    }

                    // 업로드
                    cmm.confirm(msg, () => {

                        // 배치 상태 변경
                        const callBtchStatChg = atchFileUuid => {

                            cmm.ajax({
                                url: '/api/btch/ing/btchStat',
                                data: {
                                    oderUserId: item.ODER_USER_ID,
                                    oderPgrsStat: (item.ODER_PGRS_STAT === '03' && item.ODER_KD === 'DELY') ? '04' : '05',
                                    atchFileUuid
                                },
                                success: res => {
                                    reflashHandler && reflashHandler('배달시작');

                                    imageAtchDelHandler(idx, 'all');
                                }
                            });
                        };

                        // 픽업일 경우
                        if (item.ODER_PGRS_STAT === '03' && item.ODER_KD === 'PIUP') {

                            // 업로드
                            shopS3Upload(atchImgList[idx], res => {

                                // 배치 상태 변경
                                callBtchStatChg(res.atchFileUuid);
                            });
                        } else {

                            // 배치 상태 변경
                            callBtchStatChg();
                        }
                    }, null, title);
                } else if(item.ODER_PGRS_STAT === '05') {
                    cmm.confirm(`<span>${item.ODER_DELY_FULL_ADDR}\n\n벨누르기 완료</span>하셨나요?\n벨누르기 하지 않으면 배달 완료로\n 인정이 되지 않을 수 있으니 꼭 벨을 눌러주세요`, () => {

                        // 업로드
                        shopS3Upload(atchImgList[idx], res => {

                            cmm.ajax({
                                url: '/api/btch/ing/btchComp',
                                data: {
                                    oderUserId: item.ODER_USER_ID,
                                    atchFileUuid: res.atchFileUuid,
                                },
                                success: res => {

                                    cmm.alert('배달을 완료하였습니다.\n수고하셨습니다.', () => {
                                        reflashHandler && reflashHandler('배달완료');

                                        imageAtchDelHandler(idx, 'all');
                                    });
                                },
                            });
                        });
                    }, null, '배달 완료');
                }
            }
        }
    };

    return <>
        <ul className={'btch ' + classNm} ref={ulRef}>
            {btchList.length === 0 && !isInit &&
                <li className={'noData'}>
                    <Image alt={'주문 X'} src={'/assets/images/img/noCart.svg'} width={234.23} height={200}/>
                    <p>{noDataTxt}</p>
                </li>
            }
            {btchList.map((item, idx) => (
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
                                    {cmm.getLoginInfo('SHPR_GRD_CD') !== 'ETPS' &&
                                        <>
                                            {item.DELY_AMT}원
                                            {(!isIngBtch && item.SHPR_ADJ_POIN) > 0 &&
                                                <span className={'point'}>+{cmm.util.comma(item.SHPR_ADJ_POIN)}P</span>
                                            }
                                        </>
                                    }
                                    {cmm.getLoginInfo('SHPR_GRD_CD') === 'ETPS' &&
                                        <>
                                            {item.SHOP_NM}
                                        </>
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
                                {(!!item.ODER_DELY_ARTG && (item.ODER_DELY_ARTG.indexOf('계란') > -1 || item.ODER_DELY_ARTG.indexOf('파손주의') > -1)) &&
                                    <span className={'atnt'}>파손주의</span>
                                }
                            </p>
                        }
                        <div className={'delyArea'}>
                            <div>
                                <Image alt={'배달거리 이미지'} src={`/assets/images/icon/iconDistance${item.BTCH_ODER_PGRS_MI >= 90 ? 'W' : ''}.svg`} width={24} height={14.8} />
                                <span>
                                    {item.ODER_DELY_DTC}Km
                                    {item.ODER_PGRS_STAT === '05' &&
                                        <span>
                                            배달중
                                        </span>
                                    }
                                </span>
                            </div>
                            <div>
                                <Image alt={'상품 이미지'} src={`/assets/images/icon/iconProduct${item.BTCH_ODER_PGRS_MI >= 90 ? 'W' : ''}.svg`} width={17} height={18.4} />
                                {/*{(item.ODER_KD === 'PIUP' && !!item.ODER_DELY_ARTG && item.ODER_DELY_ARTG.indexOf('김장') > -1) &&*/}
                                {/*    <span className={'type01'}>픽업(김장)</span>*/}
                                {/*}*/}
                                {/*{(item.ODER_KD === 'DELY' || !item.ODER_DELY_ARTG || item.ODER_DELY_ARTG.indexOf('김장') === -1) &&*/}
                                {/*    <span>{item.ODER_KD === 'PIUP' ? '픽업' : item.PROD_CNT + '개 상품'}</span>*/}
                                {/*}*/}
                                <span>{item.ODER_KD === 'PIUP' ? '픽업' : item.PROD_CNT + '개 상품'}</span>
                            </div>
                        </div>
                        {item.ODER_DELY_SLCT_VAL !== 'imm' &&
                            <p className={'resv'}>
                                <Image alt={'예약배달'} src={`/assets/images/icon/iconClock${item.BTCH_ODER_PGRS_MI >= 90 ? 'W' : ''}.svg`} width={16} height={16} />
                                {createTagResv(item)}
                            </p>
                        }
                        {(!!isIngBtch && item.ODER_PGRS_STAT !== '05') &&
                            <p>{item.ODER_DELY_FULL_ADDR}</p>
                        }
                        {!isIngBtch &&
                            <>
                                <p>{item.SHOP_NM}</p>
                                <p>{item.SHOP_FULL_ADDR}</p>
                            </>
                        }
                        {!!isIngBtch &&
                            <div className={'storeArea'}>
                                {item.ODER_PGRS_STAT !== '05' &&
                                    <>
                                        <h5>
                                            {item.SHOP_NM}
                                        </h5>
                                        <p>{item.SHOP_FULL_ADDR}</p>
                                    </>
                                }
                                {item.ODER_PGRS_STAT === '05' &&
                                    <>
                                        <h5>
                                            고객 주소
                                        </h5>
                                        <p>{item.ODER_DELY_FULL_ADDR}</p>
                                    </>
                                }
                                {item.BTCH_ODER_PGRS_MI >= 90 &&
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
                        }
                        {isDtptBtn &&
                            <button type={'button'} className={'button'}>상세보기</button>
                        }
                    </Link>
                    <input type={'file'} ref={element => inpFile.current[idx] = element} id={'inpImgFile' + idx} onChange={e => fileAtchChage(e, item, idx)} multiple={true} accept={'image/*'} />
                    {(isIngBtch && !!atchPrvImgList[idx] && !!atchPrvImgList[idx].length > 0) &&
                        <div className={'divImgFile'}>
                            <label onClick={() => inpFile.current[idx].click()}>
                                <div className={styles.upload}>
                                    <Image src={'/assets/images/btn/btnCamera.svg'} width={21.5} height={17} alt={'카메라'} />
                                </div>
                            </label>
                            {!!atchPrvImgList[idx] && atchPrvImgList[idx].map((url, atchIdx) => (
                                <div key={'img' + atchIdx}>
                                    <img className={'atchImag'} src={url} alt={'영수증 사진'} />
                                    <Image className={'del'} src={'/assets/images/btn/btnDel.svg'} alt={'영수증 사진'} width={20} height={20} onClick={() => imageAtchDelHandler(idx, atchIdx)} />
                                </div>
                            ))}
                        </div>
                    }
                    {(isIngBtch && item.ODER_PGRS_STAT !== '05' && item.ODER_KD === 'DELY') &&
                        <Link href={href + '/' + item.ODER_USER_ID} className={'button'} >상세</Link>
                    }
                    {item.ODER_PGRS_STAT === '02' &&
                        <button type={'button'} className={'button'} onClick={() => btchBtnClickHandler(item, idx)}>배치 수락</button>
                    }
                    {(isIngBtch && item.ODER_PGRS_STAT === '03' && item.ODER_KD === 'PIUP') &&
                        <button type={'button'} className={'button'} onClick={() => btchBtnClickHandler(item, idx)}>{!!atchPrvImgList[idx] && atchPrvImgList[idx].length > 0 ? '배달 시작' : '배달 시작(영수증 첨부)'}</button>
                    }
                    {(isIngBtch && item.ODER_PGRS_STAT === '05') &&
                        <button type={'button'} className={'button'} onClick={() => btchBtnClickHandler(item, idx)}>{!!atchPrvImgList[idx] && atchPrvImgList[idx].length > 0 ? '배달 완료' : '배달 완료(사진 첨부)'}</button>
                    }
                </li>
            ))}
        </ul>
    </>
}