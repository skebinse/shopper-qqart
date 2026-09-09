import Image from "next/image";
import styles from "../../../../styles/scheduleEditor.module.css"
import React, { useEffect, useState } from "react";
import { padStart, range } from "lodash";
import TimeSlotList from "./timeSlotList";
import cmm from "../../../../js/common";
import Select from 'react-select'
import { requestGetShops } from "../../../../util/delySchdApis";

// 시간 선택 옵션의 가장 이른 시각
const START_TIME = 10;

// 시간 선택 옵션의 개수
const TIME_SLOT_COUNT = 12;

/**
 * 일정 생성 및 수정 화면
 */
export default function ScheduleEditor(props) {
    const { date, schedule, isVisible, onSubmit, onClose } = props;

    // Shop: value 는 스토어 ID(SHOP_ID) 문자열, label 은 스토어 이름(SHOP_NM)
    const [shops, setShops] = useState([]);
    const [selectedShops, setSelectedShops] = useState([]);
    // TimeSlot: 일정 선택 옵션의 시작 시각을 나타내는 두 자리의 문자열 (ex: '07')
    const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

    useEffect(() => {
        // 스토어 목록 요청
        requestGetShops(response => {
            setShops(response.map(shop => ({ value: `${shop.SHOP_ID}`, label: shop.SHOP_NM })));
        });
    }, []);

    // 저장된 SHPR_SCHD_AREA 는 SHOP_ID 목록이므로, 스토어 목록에서 이름을 찾아 선택 값 복원
    // (스토어 목록 응답이 늦을 수 있으므로 shops 변경 시에도 다시 계산)
    useEffect(() => {
        setSelectedShops(!!schedule?.SHPR_SCHD_AREA
            ? `${schedule.SHPR_SCHD_AREA}`.split(',').map(shopId => shops.find(shop => shop.value === shopId) ?? {value: shopId, label: shopId})
            : '');
        setSelectedTimeSlots(schedule?.SHPR_SCHD_HH.split(',') ?? []);
    }, [schedule, shops]);


    /**
     * 팝업 닫을 때 데이터 초기화
     */
    useEffect(() => {

        if(!isVisible) {
            setSelectedShops('');
            setSelectedTimeSlots([]);
        }
    }, [isVisible]);

    /**
     * 선택한 스토어와 시간을 부모 페이지로 전달
     */
    const submit = () => {
        onSubmit(selectedShops.map(item => item.value), selectedTimeSlots, schedule);
        setSelectedShops('');
        setSelectedTimeSlots([]);
    }

    /**
     * 확인 버튼 클릭 하면 입력 값 검증
     */
    const onClickSubmit = () => {

        if (selectedShops.length === 0) {
            cmm.alert('스토어를 선택해 주세요.');
        } else if (selectedTimeSlots.length === 0) {
            cmm.alert('시간을 선택해 주세요.');
        } else {
            cmm.confirm('저장하시겠습니까?', submit);
        }
    };


    // TIME_SLOT_COUNT 개수만큼의 시간 선택 옵션 생성
    const timeSlots = range(TIME_SLOT_COUNT).map(offset => padStart(`${offset + START_TIME}`, 2, '0'));

    return (
        <div className={`${styles.scheduleEditor} ${isVisible ? styles.active : ''}`}>
            <div className={styles.titleDiv}>
                <h5>
                    {(!!date ? (date.getDate() + '일(' + cmm.Cont.DAY_OF_WEEK[date.getDay()]?.charAt(0)) + ')' : '')} - 스토어 및 시간 선택
                </h5>
                <Image alt={'닫기'} src={'/assets/images/icon/iconClose.svg'} width={22} height={22} onClick={onClose}/>
            </div>
            {(!!shops && shops.length > 0 && isVisible) &&
                <Select className={styles.select} isMulti closeMenuOnSelect={false} value={selectedShops}
                        options={shops} placeholder='스토어 선택' onChange={event => {setSelectedShops(event)}}/>
            }
            <TimeSlotList slots={timeSlots} selectedSlots={selectedTimeSlots} onChangeSelection={setSelectedTimeSlots}/>
            <div className={styles.okButtonContainer}>
                <div className={styles.okButton} onClick={onClickSubmit}>
                    <label className={styles.okButtonLabelText}>확인</label>
                </div>
            </div>
        </div>
    )
}
