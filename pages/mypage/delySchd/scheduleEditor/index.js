import Image from "next/image";
import styles from "../../../../styles/scheduleEditor.module.css"
import React, { useEffect, useState } from "react";
import { padStart, range } from "lodash";
import TimeSlotList from "./timeSlotList";
import cmm from "../../../../js/common";
import Select from 'react-select'

// 공통 코드 목록 요청 시 지역 카테고리 값
const AREA_CD_CODE = '68';

// 시간 선택 옵션의 가장 이른 시각
const START_TIME = 10;

// 시간 선택 옵션의 개수
const TIME_SLOT_COUNT = 12;

/**
 * 일정 생성 및 수정 화면
 */
export default function ScheduleEditor(props) {
    const { date, schedule, isVisible, onSubmit, onClose } = props;

    // Area: 지역 이름을 나타내는 문자열 (ex: '서초구 방배1동')
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState('');
    // TimeSlot: 일정 선택 옵션의 시작 시각을 나타내는 두 자리의 문자열 (ex: '07')
    const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

    useEffect(() => {
        // 지역 목록 요청
        cmm.biz.commCdList(AREA_CD_CODE, response => {
            setAreas(response.map(cd => cd.CD_NM));
        });
    }, []);

    useEffect(() => {
        setSelectedArea(schedule?.SHPR_SCHD_AREA ?? '');
        setSelectedTimeSlots(schedule?.SHPR_SCHD_HH.split(',') ?? []);

    }, [schedule]);


    /**
     * 팝업 닫을 때 데이터 초기화
     */
    useEffect(() => {

        if(!isVisible) {
            setSelectedArea('');
            setSelectedTimeSlots([]);
        }
    }, [isVisible]);

    /**
     * 선택한 지역과 시간을 부모 페이지로 전달
     */
    const submit = () => {
        onSubmit(selectedArea, selectedTimeSlots);
        setSelectedArea('');
        setSelectedTimeSlots([]);
    }

    /**
     * 확인 버튼 클릭 하면 입력 값 검증
     */
    const onClickSubmit = () => {
        if (selectedArea.length === 0) {
            cmm.alert('지역을 선택해 주세요.');
        } else if (selectedTimeSlots.length === 0) {
            cmm.alert('시간을 선택해 주세요.');
        } else {
            cmm.confirm('저장하시겠습니까?', submit);
        }
    };

    // 지역 목록을 드랍다운 옵션으로 생성
    const areaOptions = areas.map(area => ({ value: area, label: area }));
    
    // TIME_SLOT_COUNT 개수만큼의 시간 선택 옵션 생성
    const timeSlots = range(TIME_SLOT_COUNT).map(offset => padStart(`${offset + START_TIME}`, 2, '0'));

    return (
        <div className={`${styles.scheduleEditor} ${isVisible ? styles.active : ''}`}>
            <div className={styles.titleDiv}>
                <h5>
                    {(!!date ? (date.getDate() + '일(' + cmm.Cont.DAY_OF_WEEK[date.getDay()]?.charAt(0)) + ')' : '')} - 지역 및 시간 선택
                </h5>
                <Image alt={'닫기'} src={'/assets/images/icon/iconClose.svg'} width={22} height={22} onClick={onClose}/>
            </div>
            <Select className={styles.select} value={areaOptions.filter(item => item.value === selectedArea)}
                    options={areaOptions} placeholder='지역 선택' onChange={event => setSelectedArea(event.value)}/>
            <TimeSlotList slots={timeSlots} selectedSlots={selectedTimeSlots} onChangeSelection={setSelectedTimeSlots}/>
            <div className={styles.okButtonContainer}>
                <div className={styles.okButton} onClick={onClickSubmit}>
                    <label className={styles.okButtonLabelText}>확인</label>
                </div>
            </div>
        </div>
    )
}
