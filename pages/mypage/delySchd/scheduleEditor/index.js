import Image from "next/image";
import styles from "../../../../styles/scheduleEditor.module.css"
import { useEffect, useState } from "react";
import { padStart, range } from "lodash";
import TimeSlotList from "./timeSlotList";

const DUMMY_AREAS = [
    {
        id: '000',
        label: '용산구',
    }, {
        id: '001',
        label: '중구',
    }, {
        id: '002',
        label: '종로구',
    }
]

const DEFAULT_AREA = {
    id: '-1',
    label: '지역 선택'
};

const START_TIME = 7;

export default function ScheduleEditor(props) {
    const { schedule, isVisible, onSubmit, onClose } = props;

    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

    useEffect(() => {
        // TODO: 서버에서 지역 목록 받아 오기
        setAreas(DUMMY_AREAS);
    }, [])

    useEffect(() => {
        setSelectedArea(schedule?.SHPR_SCHD_AREA ?? '');
        setSelectedTimeSlots(schedule?.SHPR_SCHD_HH.split(',') ?? [])
    }, [schedule])

    const areaOptions = [DEFAULT_AREA].concat(areas).map(area => <option key={area.id} value={area.id} label={area.label} />);
    
    const timeSlots = range(14).map(offset => padStart(`${offset + START_TIME}`, 2, '0'));

    return (
        <div className={`${styles.scheduleEditor} ${isVisible ? styles.active : ''}`}>
            <div className={styles.titleDiv}>
                <h5>지역 및 시간 선택</h5>
                <Image alt={'닫기'} src={'/assets/images/icon/iconClose.svg'} width={22} height={22} onClick={onClose} />
            </div>
            <select value={selectedArea} onChange={event => setSelectedArea(event.target.value)}>
                {areaOptions}
            </select>
            <TimeSlotList slots={timeSlots} selectedSlots={selectedTimeSlots} onChangeSelection={setSelectedTimeSlots} />
            <div className={styles.okButtonContainer}>
                <div className={styles.okButton} onClick={() => onSubmit(selectedArea, selectedTimeSlots)}>
                    <label className={styles.okButtonLabelText}>확인</label>
                </div>
            </div>
        </div>
    )
}
