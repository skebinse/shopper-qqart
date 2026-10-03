import React, {useEffect, useState} from 'react';
import styles from "../../styles/join.module.css";
import {useRouter} from "next/router";
import useCommon from "../../hooks/useCommon";
import cmm from "../../js/common";
import {BANK_LIST} from "../../js/bankList";
import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import Select from 'react-select'

export default function EssInfoInpt(props) {

    const {goPage} = useCommon();
    const router = useRouter();
    const [userInfo, setUserInfo] = useState({});
    const [carKdList, setCarKdList] = useState([]);
    const [prvImg, setPrvImg] = useState(null);
    const options = BANK_LIST;

    useEffect(() => {

        window.drvLicImg = null;

        if(!!document.querySelector('#ch-plugin')) {
            document.querySelector('#ch-plugin').classList.add('d-none');
        }

        // 본인인증 실패
        if(!!router.query.error) {

            cmm.alert('본인인증에 실패하였습니다.\n다시 한번 진행해 주세요.', () => {
                goPage('/join/selfCfm');
            });
        // 본인인증 성공 및 새로고침 - 인증 결과는 서버 가입 세션(서명 쿠키)에서 표시용 값만 조회
        } else {

            cmm.ajax({
                url: '/api/join/selfCfmInfo',
                success: res => {

                    setUserInfo(prevState => ({...prevState, name: res.name, iden: res.brdt}));
                },
                error: res => {

                    cmm.alert(res?.resultMsg || '본인인증 정보가 없습니다.\n본인인증을 다시 진행해 주세요.', () => {
                        goPage('/join/selfCfm');
                    });
                }
            });
        }

        cmm.ajax({
            url: '/api/cmm/commCdList',
            data: {
                cdSppoId: 208
            },
            success: res => {

                setCarKdList(res.map(item => ({value: item.CD_NM, label: item.CD_NM})));
            },
        });

        return () => {
            if(!!document.querySelector('#ch-plugin')) {
                document.querySelector('#ch-plugin').classList.remove('d-none');
            }
        };
    }, []);

    /**
     * 다음 화면
     */
    const nextHandler = () => {

        if(!window.drvLicImg) {
            cmm.alert('면허증 사진을 올려주세요.');
            return;
        } else if(!userInfo.shprVhclKd) {
            cmm.alert('차종을 선택해 주세요.');
            return;
        } else if(!userInfo.shprVhclNm) {
            cmm.alert('차량명을 입력해 주세요.');
            return;
        } else if(!userInfo.shprVhclNo) {
            cmm.alert('차량번호를 입력해 주세요.');
            return;
        } else if(!userInfo.bankCd) {
            cmm.alert('은행을 선택해 주세요.');
            return;
        } else if(!userInfo.bankNum) {
            cmm.alert('통장번호를 입력해 주세요.');
            return;
        }
        cmm.ajax({
            url: '/api/join/bnkbSelfAhrz',
            data: {...userInfo, joinYn: 'Y'},
            success: res => {

                if(res) {

                    cmm.util.setLs(cmm.Cont.JOIN_INFO, {...cmm.util.getLs(cmm.Cont.JOIN_INFO), ...userInfo});
                    goPage('./reg');
                }
            }
        });
    }

    /**
     * 면허증 변경
     * @param e
     */
    const fileChage = e => {

        if(e.target.files.length > 0) {

            cmm.loading(true);
            const uploadFile = e.target.files[0];

            // 썸네일
            cmm.util.getThumbFile({file: uploadFile, maxSize: 1024, type: uploadFile.type}).then(imgData => {
                setPrvImg(window.URL.createObjectURL(imgData.blob));
                window.drvLicImg = imgData.blob;

                cmm.loading(false);
            });
        }
    };

    /**
     * 이미지 회전
     */
    const drvLicImgRotateHandler = () => {

        cmm.loading(true);

        // 썸네일
        cmm.util.getThumbFile({file: window.drvLicImg, maxSize: 1024, type: window.drvLicImg.type, rotate: 90}).then(imgData => {
            setPrvImg(window.URL.createObjectURL(imgData.blob));
            window.drvLicImg = imgData.blob;

            cmm.loading(false);
        });
    };

    return (
        <div className={styles.join}>
            <HeadTitle callbackClose={() => goPage('/join/selfCfm')} />
            <NaviStep step={3} />
            <div className={styles.content}>
                <h3>면허증 및 통장 정보</h3>
                <div className={styles.drvLicDiv + ' ' + (!!prvImg ? styles.prevImgShow : '')}>
                    <label htmlFor={'inpFile'}>
                        <input type={'file'} id={'inpFile'} accept={'image/*'} onChange={fileChage} />
                        <span>면허증 사진을 올려주세요.</span>
                        <button type={'button'}>
                            <img src={'/assets/images/icon/iconPlus.svg'}/>
                            사진 등록
                        </button>
                    </label>
                    <div>
                        <img src={prvImg} onClick={() => inpFile.click()} />
                        <span onClick={drvLicImgRotateHandler}>
                            <img src={'/assets/images/icon/iconRefresh.svg'}/>
                        </span>
                    </div>
                </div>
                <ul className={styles.info}>
                    <li>
                        <label>차종</label>
                        <div className={styles.select2}>
                            <Select placeholder={'차종을 선택해 주세요'}
                                    onChange={e => setUserInfo(prevState => ({
                                        ...prevState,
                                        shprVhclKd: e.label,
                                    }))} options={carKdList}/>
                        </div>
                    </li>
                    <li>
                    <label>차량명</label>
                        <div>
                            <input onChange={e => setUserInfo(prevState => ({...prevState, shprVhclNm: e.target.value}))} type="text" placeholder="차량명을 입력해 주세요"/>
                        </div>
                    </li>
                    <li>
                        <label>차량 번호</label>
                        <div>
                            <input onChange={e => setUserInfo(prevState => ({...prevState, shprVhclNo: e.target.value}))} type="text" placeholder="123퀵4567"/>
                        </div>
                    </li>
                    <li>
                        <label>이름</label>
                        <div>
                            <input value={userInfo.name ?? ''} type="text" placeholder="아이디를 입력해 주세요" readOnly/>
                        </div>
                    </li>
                    <li>
                        <label>생년월일</label>
                        <div>
                            <input value={!!userInfo.iden ? userInfo.iden.substring(0, 6) : ''}
                                   type="text" placeholder="아이디를 입력해 주세요" readOnly maxLength={6}/>
                        </div>
                    </li>
                    <li>
                        <label>은행</label>
                        <div className={styles.select2}>
                            <Select placeholder={'은행을 선택해 주세요'}
                                    onChange={e => setUserInfo(prevState => ({
                                        ...prevState,
                                        bankCd: e.value,
                                        bankNm: e.label
                                    }))} options={options}/>
                        </div>
                    </li>
                    <li>
                        <label>통장번호</label>
                        <div>
                            <input onChange={e => setUserInfo(prevState => ({...prevState, bankNum: e.target.value}))}
                                   type="text" placeholder="통장번호를 입력해 주세요"/>
                        </div>
                    </li>
                </ul>
                <div className={styles.btnArea}>
                    <button type={"button"} onClick={nextHandler}>확인</button>
                </div>
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {
    const {req, params  } = context;

    return {
        props: {},
    }
}
