import React, {useEffect, useRef, useState} from 'react';
import Head from "next/head";
import {useRouter} from "next/router";
import HeadTitle from "../../../components/headTitle";
import useCommon from "../../../hooks/useCommon";
import cmm from "../../../js/common";
import {getPiupSectList} from "../../../util/piupZoneUtil";
import styles from "../../../styles/piupZone.module.css";

/**
 * 이마트 매장 픽업존 안내 (진행 상세의 [픽업존 안내] 에서 진입)
 * 내용은 www 관리자 "스토어 > 픽업존 관리" 에서 입력한다
 */
export default function PiupZone() {

    const router = useRouter();
    const {goPage} = useCommon();
    const {shopId} = router.query;
    const [shopNm, setShopNm] = useState('');
    const [sectList, setSectList] = useState(null);
    const topRef = useRef(null);

    useEffect(() => {

        if(!shopId) {
            return;
        }

        cmm.ajax({
            url: `/api/btch/piupZone/${shopId}`,
            success: res => {

                setShopNm(res.shopNm);
                setSectList(getPiupSectList(res.grpList, res.fileList));
            }
        });
    }, [shopId]);

    /**
     * 닫기 (진행 상세에서 들어오므로 뒤로, 주소로 바로 열었으면 메인으로)
     */
    const closeHandler = () => {

        if(history.length > 1) {

            router.back();
        } else {

            goPage('/');
        }
    };

    /**
     * 섹션 이동 (헤더·칩 높이만큼 띄움)
     * @param kd
     */
    const sectMoveHandler = kd => {

        const el = document.getElementById('pz' + kd);

        if(!!el) {

            const top = el.getBoundingClientRect().top + window.scrollY - (topRef.current?.offsetHeight || 0) - 12;
            window.scrollTo({top, behavior: 'smooth'});
        }
    };

    /**
     * 한 줄 렌더 (주의는 빨강이 아니라 주황 + ⚠ 로 그림. 빨강은 오류·취소 전용)
     * @param line
     * @param idx
     */
    const renderLine = (line, idx) => {

        const isCaution = line.spans.some(s => s.caution);
        const body = line.spans.map((s, sIdx) => (
            <span key={sIdx} className={[s.caution ? styles.caution : '', s.strong ? styles.strong : ''].join(' ').trim() || undefined}>{s.t}</span>
        ));

        if(line.kind === 'head') {

            return <div key={idx} className={styles.lineHead}>{body}</div>;
        }

        return (
            <div key={idx} className={styles.line}>
                <span className={isCaution ? styles.markCaution : styles.mark} aria-hidden>
                    {line.kind === 'item' ? (isCaution ? '⚠' : '·') : (isCaution ? '⚠' : '')}
                </span>
                <span>{body}</span>
            </div>
        );
    };

    return (
        <>
            <Head>
                <script src="/assets/js/blueimp-gallery.min.js" defer></script>
            </Head>
            <div className={styles.top} ref={topRef}>
                <HeadTitle title={`${shopNm} 픽업존`} type={'close'} callbackClose={closeHandler} />
                {!!sectList && sectList.length > 0 &&
                    <nav className={styles.chips}>
                        {sectList.map(sect => (
                            <button key={sect.kd} type={'button'} onClick={() => sectMoveHandler(sect.kd)}>{sect.label}</button>
                        ))}
                    </nav>
                }
            </div>
            <div className={styles.body}>
                {!!sectList && sectList.length === 0 &&
                    <p className={styles.empty}>등록된 픽업존 안내가 없습니다.</p>
                }
                {!!sectList && sectList.map(sect => (
                    <section key={sect.kd} id={'pz' + sect.kd} className={styles.section}>
                        <h4>{sect.label}</h4>
                        {sect.grpList.map((grp, gIdx) => (
                            <div key={gIdx} className={styles.group}>
                                {!!grp.title &&
                                    <h5>{grp.title}</h5>
                                }
                                {grp.photoList.length > 0 &&
                                    <div className={styles.strip}>
                                        {grp.photoList.map((url, pIdx) => (
                                            <button key={url} type={'button'} className={grp.photoList.length === 1 ? styles.only : undefined}
                                                    onClick={() => cmm.util.showImageZoom(grp.photoList, pIdx)}>
                                                <img src={url} alt={`사진 ${pIdx + 1}`} loading={'lazy'} />
                                            </button>
                                        ))}
                                    </div>
                                }
                                {grp.lineList.length > 0 &&
                                    <div className={styles.lines}>
                                        {grp.lineList.map(renderLine)}
                                    </div>
                                }
                            </div>
                        ))}
                    </section>
                ))}
                {!!sectList && sectList.length > 0 &&
                    <p className={styles.source}>이마트 매장 방문 보고서 기준 · 현장과 다르면 운영팀에 알려 주세요</p>
                }
            </div>
            <div id="blueimp-gallery" className="blueimp-gallery blueimp-gallery-controls" aria-label="image gallery"
                 aria-modal="true" role="dialog">
                <div className="slides" aria-live="polite"></div>
                <h3 className="title"></h3>
                <a className="prev" aria-controls="blueimp-gallery" aria-label="previous slide"
                   aria-keyshortcuts="ArrowLeft"></a>
                <a className="next" aria-controls="blueimp-gallery" aria-label="next slide"
                   aria-keyshortcuts="ArrowRight"></a>
                <a className="close" aria-controls="blueimp-gallery" aria-label="close" aria-keyshortcuts="Escape"></a>
                <ol className="indicator"></ol>
            </div>
        </>
    );
}

export async function getServerSideProps(context) {

    return {
        props: {},
    }
}
