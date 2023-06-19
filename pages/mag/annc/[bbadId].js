import React, {useEffect, useState} from 'react';
import HeadTitle from "../../../components/headTitle";
import styles from "../../../styles/mag.module.css";
import cmm from "../../../js/common";
import Link from "next/link";
import {useRouter} from "next/router";
import Head from "next/head";

export default function AnncDtpt() {

    const router = useRouter();
    const [title, setTitle] = useState('');
    const [anncDtpt, setAnncDtpt] = useState({});
    const {bbadId} = router.query;

    useEffect(() => {

        // 에디터 설정 후 데이터 조회
        const setEditor = () => {

            ClassicEditor.create( document.querySelector( '.editor' ), {
                licenseKey: '',
                readOnly: true,
            })
                .then( editor => {

                    // 게시판 상세 조회
                    cmm.ajax({
                        url: `/api/mag/anncs/${bbadId}`,
                        success: res => {

                            setAnncDtpt(res);
                            setTitle(res.BBAD_KD === '공지' ? '공지사항' : res.BBAD_KD);

                            const toolbarElement = editor.ui.view.toolbar.element;
                            toolbarElement.style.display = 'none';

                            editor.enableReadOnlyMode('.editor');

                            editor.setData(res.BBAD_TEXT);
                        }
                    });

                })
                .catch( error => {
                    console.error( error );
                });
        };

        if(!!window.ClassicEditor) {

            // 에디터 설정 후 데이터 조회
            setEditor();
        } else {

            const cordovaJs = document.createElement('script');

            cordovaJs.id = "ckeditorjs";
            cordovaJs.setAttribute('src', `/assets/js/ckeditor5/ckeditor.js`);
            cordovaJs.addEventListener('load', () => {

                // 에디터 설정 후 데이터 조회
                setEditor();
            });

            document.querySelector('body').appendChild(cordovaJs);
        }

    }, []);

    return (
        <div className={styles.anncDtpt}>
            <HeadTitle title={title} />
            <div className={styles.content}>
                <h3>{anncDtpt.BBAD_TITL}</h3>
                <p>{anncDtpt.RGI_DT}</p>
                <div className={'editor'}></div>
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {

    return {
        props: {},
    }
}