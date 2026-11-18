import React, {useState} from 'react';
import cmm from "../../js/common";

/**
 * 고객 연락처 — 실번호 대신 "번호 비공개" + [전화 걸기]
 * 버튼을 누르면 서버에서 050 안심번호를 받아 tel: 로 전화 앱을 연다. 안심번호도 화면에 띄우지 않는다.
 * 누를 때마다 서버에 묻는다(같은 주문은 서버가 저장된 번호를 재사용, 자정 · 완료로 해제된 번호는 새로 받음).
 * @param oderUserId 주문 사용자 ID
 * @param callable false 면 버튼 없이 "번호 비공개" 만 표시
 */
export default function SafeNoCall({oderUserId, callable = true}) {

    const [loading, setLoading] = useState(false);

    const callHandler = () => {

        if(loading) {

            return;
        }

        setLoading(true);

        cmm.ajax({
            url: '/api/btch/safeNo',
            data: {oderUserId},
            success: res => {

                setLoading(false);

                if(!!res?.safeNo) {

                    window.location.href = 'tel:' + res.safeNo;
                }
            },
            error: res => {

                setLoading(false);
                cmm.alert(res?.resultMsg || '안심번호를 받지 못했습니다.\n잠시 후 다시 시도해 주세요.');
            },
        });
    };

    return (
        <p>
            <span>번호 비공개</span>
            {callable &&
                <button type={'button'} className={'button white short'} style={{marginLeft: '8px'}}
                        disabled={loading} onClick={callHandler}>
                    {loading ? '연결 중…' : '전화 걸기'}
                </button>
            }
        </p>
    );
}
