import React, {useEffect, useState} from 'react';
import HeadTitle from "../../../components/headTitle";
import styles from "../../../styles/mag.module.css";
import cmm from "../../../js/common";
import Link from "next/link";
import {useRouter} from "next/router";
import Head from "next/head";
import useCommon from "../../../hooks/useCommon";

export default function AnncDtpt() {

    const router = useRouter();
    const {goPage} = useCommon();
    const [title, setTitle] = useState('');
    const [anncDtpt, setAnncDtpt] = useState({});
    const {bbadId} = router.query;

    useEffect(() => {

        let editorInstance = null;
        let destroyed = false;

        // 에디터 설정 후 데이터 조회
        const setEditor = async () => {

            // SSR 에서 window 를 참조하므로 클라이언트에서만 로드
            const {
                ClassicEditor, Essentials, Paragraph, Heading, Bold, Italic, FontSize, FontColor, FontBackgroundColor,
                Link, AutoLink, List, Indent, BlockQuote, Image, ImageCaption, ImageStyle, ImageResize, MediaEmbed,
                Table, TableToolbar, TableProperties, TableCellProperties, PasteFromOffice,
            } = await import('ckeditor5');

            if(destroyed) return;

            ClassicEditor.create( document.querySelector( '.editor' ), {
                licenseKey: 'GPL',
                plugins: [
                    Essentials, Paragraph, Heading, Bold, Italic, FontSize, FontColor, FontBackgroundColor,
                    Link, AutoLink, List, Indent, BlockQuote, Image, ImageCaption, ImageStyle, ImageResize, MediaEmbed,
                    Table, TableToolbar, TableProperties, TableCellProperties, PasteFromOffice,
                ],
                toolbar: [],
                table: {
                    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
                    // 기본값(1px solid)과 같은 테두리가 데이터에서 빠지지 않도록 기본값을 없음으로 둔다
                    tableProperties: {defaultProperties: {borderStyle: 'none', borderWidth: '0px'}},
                    tableCellProperties: {defaultProperties: {borderStyle: 'none', borderWidth: '0px'}},
                },
            })
                .then( editor => {

                    if(destroyed) {

                        editor.destroy();
                        return;
                    }

                    editorInstance = editor;

                    // 업체 쇼퍼일 경우
                    if(cmm.getLoginInfo('SHPR_GRD_CD') === 'ETPS') {

                        goPage('/');
                    } else {

                        // 게시판 상세 조회
                        cmm.ajax({
                            url: `/api/mag/anncs/${bbadId}`,
                            success: res => {

                                if(!!res.invisible) {

                                    goPage('/');
                                } else {

                                    setAnncDtpt(res);
                                    setTitle(res.BBAD_KD === '공지' ? '공지사항' : res.BBAD_KD);

                                    editor.enableReadOnlyMode('.editor');

                                    editor.setData(res.BBAD_TEXT);
                                }

                            }
                        });
                    }

                })
                .catch( error => {
                    console.error( error );
                });
        };

        // 에디터 설정 후 데이터 조회
        setEditor();

        return () => {

            destroyed = true;

            if(!!editorInstance) {

                editorInstance.destroy();
            }
        };

    }, [bbadId]);

    return (
        <div className={styles.anncDtpt}>
            <HeadTitle title={title} />
            <div className={styles.content}>
                <h3>{anncDtpt.BBAD_TITL}</h3>
                <p>
                    {anncDtpt.BBAD_KD !== '공지' &&
                        <>{anncDtpt.RGI_DT}</>
                    }
                </p>
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