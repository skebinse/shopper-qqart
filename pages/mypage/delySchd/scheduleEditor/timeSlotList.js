import { padStart, remove } from "lodash";
import styles from "../../../../styles/scheduleEditor.module.css"

/**
 * 시간 선택 옵션 목록
 */
export default function TimeSlotList(props) {
    const { slots, selectedSlots, onChangeSelection } = props;

    /**
     * 시간 선택 옵션의 항목 클릭 시, 체크 되어 있던 항목은 체크 해제, 체크 되지 않았던 항목은 체크 하여 부모 화면에 전달
     */
    const onClickItem = (slot, checked) => {
        if (checked) {
            const newlySelectedSlots = [...selectedSlots];
            remove(newlySelectedSlots, selectedSlot => selectedSlot === slot);
            onChangeSelection(newlySelectedSlots);
        } else {
            onChangeSelection(selectedSlots.concat([slot]));
        }
    }
 
    // 전달 받은 시간 선택 옵션들로 항목 생성
    // slot: '07', '09' 등의 시작 시각을 나타내는 두 자리의 문자열
    const checkboxes = slots?.map(slot => {
        const startHourString = `${slot}:00`;
        const endHour = Number(slot) + 1;
        const endHourString = `${padStart(`${endHour}`, 2, '0')}:00`;
        const checked = selectedSlots.includes(slot);

        return (
            <li key={startHourString} onClick={() => onClickItem(slot, checked)}>
                <input type='checkbox' checked={checked} onChange={() => onClickItem(slot, checked)}/>
                <label className={styles.labelText}>
                    {`${startHourString} ~ ${endHourString}`}
                </label>
            </li>
        )
    }).concat([<li key='footer' className={styles.footer} />])

    return (
        <div className={styles.timeSlotList}>
            <label className={styles.headerText}>시간 선택</label>
            <ul>
                {checkboxes}
            </ul>
        </div>
    )
}
