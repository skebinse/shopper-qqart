import React, {useState} from 'react';
import cmm from "../../js/common";

/**
 * 050 안심번호 표시용 하이픈 (0507-1234-5678 / 050-1234-5678)
 * cmm.util.hyphenTel 은 11자리까지만 처리한다
 * @param no
 * @returns {string}
 */
const formatSafeNo = no => {

    const digits = String(no).replace(/[^0-9]/g, '');

    return digits.length === 12
        ? digits.replace(/^(\d{4})(\d{4})(\d{4})$/, '$1-$2-$3')
        : cmm.util.hyphenTel(digits);
};

/**
 * 고객 연락처 —실번호 대신 "번호 비공개" + [전화 걸기]
 * 버튼을 누르면 서버에서 050 안심번호를 받아 tel: 로 전화 앱을 연다.
 * @param oderUserId 주문 사용자 ID
 * @param callable false 면 버튼 없이 "번호 비공개" 만 표시
 */
export default function SafeNoCall({oderUserId, callable = true}) {

    const [safeNo, setSafeNo] = useState('');
    const [loading, setLoading] = useState(false);

    const call = no => {

        window.location.href = 'tel:' + no;
    };

    const callHandler = () => {

        if(loading) {

            return;
        }

        if(!!safeNo) {

            call(safeNo);
            return;
        }

        setLoading(true);

        cmm.ajax({
            url: '/api/btch/safeNo',
            data: {oderUserId},
            success: res => {

                setLoading(false);

                if(!!res?.safeNo) {

                    setSafeNo(res.safeNo);
                    call(res.safeNo);
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
            {!!safeNo &&
                <a className={'colorGreen bold'} style={{display: 'block', marginTop: '6px'}} href={'tel:' + safeNo}>
                    안심번호 {formatSafeNo(safeNo)}
                </a>
            }
        </p>
    );
}
