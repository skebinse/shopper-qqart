import React, {useEffect, useState} from 'react';
import styles from "../../styles/join.module.css";
import {useRouter} from "next/router";
import useCommon from "../../hooks/useCommon";
import cmm from "../../js/common";
import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import Select from 'react-select'

export default function EssInfoInpt(props) {

    const {goPage} = useCommon();
    const router = useRouter();
    const [userInfo, setUserInfo] = useState({});
    const [prvImg, setPrvImg] = useState(null);
    const options = [
        {value: '0002', label: '산업은행'},
        {value: '0003', label: '기업은행'},
        {value: '0004', label: '국민은행'},
        {value: '0007', label: '수협중앙회'},
        {value: '0011', label: '농협은행'},
        {value: '0012', label: '지역농축협'},
        {value: '0020', label: '우리은행'},
        {value: '0023', label: 'SC은행'},
        {value: '0027', label: '씨티은행'},
        {value: '0031', label: '대구은행'},
        {value: '0032', label: '부산은행'},
        {value: '0034', label: '광주은행'},
        {value: '0035', label: '제주은행'},
        {value: '0037', label: '전북은행'},
        {value: '0039', label: '경남은행'},
        {value: '0045', label: '새마을금고'},
        {value: '0048', label: '신협'},
        {value: '0050', label: '저축은행'},
        {value: '0054', label: 'HSBC'},
        {value: '0055', label: '도이치은행'},
        {value: '0057', label: 'JP모간'},
        {value: '0060', label: 'BOA은행'},
        {value: '0061', label: 'BNP 은행'},
        {value: '0062', label: 'ICBC'},
        {value: '0064', label: '산림조합'},
        {value: '0067', label: 'CCB'},
        {value: '0071', label: '우체국'},
        {value: '0081', label: '하나은행'},
        {value: '0088', label: '신한은행'},
        {value: '0089', label: '케이뱅크'},
        {value: '0090', label: '카카오뱅크'},
        {value: '0092', label: '토스뱅크'},
    ]

    useEffect(() => {

        if(!!document.querySelector('#ch-plugin')) {
            document.querySelector('#ch-plugin').classList.add('d-none');
        }

        return () => {
            if(!!document.querySelector('#ch-plugin')) {
                document.querySelector('#ch-plugin').classList.remove('d-none');
            }
        };
    }, []);

    useEffect(() => {

        console.log(!!router.query.name)
        if(!!router.query.error) {

            cmm.alert('본인인증에 실패하였습니다.\n다시 한번 진행해 주세요.', () => {
                goPage('/join/selfCfm');
            });
        } else if(!!router.query.name) {

            cmm.util.setLs('selfCfm', router.query);
            setUserInfo(router.query);
            goPage(router.pathname);
        } else {

            setUserInfo(!!cmm.util.getLs('selfCfm') ? cmm.util.getLs('selfCfm') : {});
        }
        // https://localhost:3000/join/essInfoInpt?name=박장용&nameHash=$2b$10$FmebTEUUXulJC63UgYNpHuuWcC18MIVKu/xktT.WK7LS5A5bY5.wO&iden=8304081

    }, []);

    /**
     * 다음 화면
     */
    const nextHandler = () => {

        cmm.ajax({
            url: '/api/join/bnkbSelfAhrz',
            data: userInfo,
            success: res => {
                console.log(res);
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

                cmm.loading(false);
            });
        }
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
                    <img src={prvImg} onClick={() => inpFile.click()} />
                </div>
                <ul className={styles.info}>
                    <li>
                        <label>이름</label>
                        <div>
                            <input defaultValue={userInfo.name} type="text" placeholder="아이디를 입력해 주세요" readOnly />
                        </div>
                    </li>
                    <li>
                        <label>생년월일</label>
                        <div>
                            <input defaultValue={!!userInfo.iden ? userInfo.iden.substring(0, 6) : ''}
                                   type="text" placeholder="아이디를 입력해 주세요" readOnly maxLength={6}/>
                        </div>
                    </li>
                    <li>
                        <label>은행</label>
                        <div className={styles.select2}>
                            <Select placeholder={'은행을 선택해주세요'}
                                    onChange={e => setUserInfo(prevState => ({...prevState, backCd: e.value}))} options={options} />
                        </div>
                    </li>
                    <li>
                        <label>통장번호</label>
                        <div>
                            <input onChange={e => setUserInfo(prevState => ({...prevState, backNum: e.target.value}))}
                                   type="text" placeholder="통장번호를 입력해 주세요" />
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
    const { req, params  } = context;

    return {
        props: {},
    }
}
