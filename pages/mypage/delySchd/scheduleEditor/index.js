import Image from "next/image";
import styles from "../../../../styles/scheduleEditor.module.css"
import { useEffect, useState } from "react";
import { padStart, range } from "lodash";
import TimeSlotList from "./timeSlotList";
import cmm from "../../../../js/common";

const DEFAULT_AREA = '지역 선택';
const AREA_CD_CODE = '68';

const START_TIME = 7;

export default function ScheduleEditor(props) {
    const { schedule, isVisible, onSubmit, onClose } = props;

    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

    useEffect(() => {
        cmm.biz.commCdList(AREA_CD_CODE, response => {
            setAreas(response.map(cd => cd.CD_NM));
        });
    }, []);

    useEffect(() => {
        setSelectedArea(schedule?.SHPR_SCHD_AREA ?? '');
        setSelectedTimeSlots(schedule?.SHPR_SCHD_HH.split(',') ?? [])
    }, [schedule]);

    const submit = () => {
        onSubmit(selectedArea, selectedTimeSlots);
        setSelectedArea('');
        setSelectedTimeSlots([]);
    }

    const onClickSubmit = () => {
        if (selectedArea.length === 0 || selectedArea === DEFAULT_AREA) {
            cmm.alert('지역을 선택해 주세요.');
        } else if (selectedTimeSlots.length === 0) {
            cmm.alert('시간을 선택해 주세요.');
        } else {
            cmm.confirm('저장하시겠습니까?', submit);
        }
    };
 
    const areaOptions = [DEFAULT_AREA].concat(areas).map(area => <option key={area} value={area} label={area} />);
    
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
                <div className={styles.okButton} onClick={onClickSubmit}>
                    <label className={styles.okButtonLabelText}>확인</label>
                </div>
            </div>
        </div>
    )
}
