import {useEffect} from "react";
import {useRouter} from "next/router";
import cmm from "../../js/common";

export default function QrCode(props) {

    const router = useRouter();
    const {qrcode} = router.query;

    useEffect(() => {

        if(!!qrcode) {

            cmm.ajax({
                url: '/api/btch/ing/btchQrcode',
                data: {
                    oderUserId: qrcode.substring(4),
                    oderPgrsStat: '05',
                },
                success: res => {

                    cmm.alert('배달 시작으로 변경됩니다.');
                    router.replace('/');
                },
                error: res => {

                    if(res.resultCode === '9002') {

                        cmm.alert(res.resultMsg, () => {

                            router.replace('/');
                        });
                    } else if(res.resultCode === '9003') {
                        cmm.alert(`<span style="color: #02B763;font-weight: 700;">${res.resultMsg}</span>`, () => {

                            router.replace('/');
                        }, '완료');
                    } else {

                        cmm.alert(`<span style="color: red;font-weight: 700;">${res.resultMsg}</span>`, () => {

                            router.replace('/');
                        }, '실패');
                    }
                }
            });
        }
    }, [qrcode]);

    return '';
}