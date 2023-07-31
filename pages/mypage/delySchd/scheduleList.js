import { addDays, isBefore, isSameDay } from 'date-fns';
import Image from 'next/image';
import styles from "../../../styles/scheduleList.module.css"
import cmm from '../../../js/common';
import { range } from 'lodash';

export default function ScheduleList(props) {
    const { startDate, schedules, holidays, onClickItem } = props;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = range(7).map((offset) => {
        const date = addDays(startDate, offset);
        const schedule = schedules.find(savedSchedule => isSameDay(new Date(savedSchedule.SHPR_SCHD_YMD), date));
        const isHoliday = holidays.some(holiday => isSameDay(date, holiday)) || date.getDay() % 6 === 0;
        
        return {
            schedule: schedule,  
            dateString: date.getDate().toString(),
            dayString: cmm.Cont.DAY_OF_WEEK[date.getDay()].charAt(0),
            disabled: isBefore(date, today),
            isHoliday,
            onClickItem: () => onClickItem(date, schedule),
        }
    });

    return (
        <div className={styles.scheduleList}>
            <ul>
                {renderList(items)}
            </ul>
        </div>
    )
}

function renderList(items) {
    return items.map(item => {
        const { schedule, dateString, dayString, disabled, isHoliday, onClickItem } = item;

        const scheduleString = (() => {
            if (schedule === undefined) {
                return disabled ? '등록 불가' : '등록하기'
            } else {
                return schedule.SHPR_SCHD_HH;
            }
        })()

        const dateStyleKeySuffix = disabled ? 'disabled' : isHoliday ? 'holiday' : '';
        const scheduleStyleKeySuffix = disabled ? 'disabled' : schedule === undefined ? 'unregistered' : ''

        return (
            <li key={dateString} onClick={disabled ? undefined : onClickItem}>
                <div className={styles.dayContainer}>
                    <label className={`${styles.dateText} ${styles[dateStyleKeySuffix]}`}>{dateString}</label>
                    <label className={`${styles.dayText} ${styles[dateStyleKeySuffix]}`}>{dayString}</label>
                </div>
                <div className={`${styles.scheduleContainerTail} ${styles[scheduleStyleKeySuffix]}`} />
                <div className={`${styles.scheduleContainer} ${styles[scheduleStyleKeySuffix]}`}>
                    {schedule && !disabled && (
                        <Image alt={'일정'} src={'/assets/images/icon/iconCheck.svg'} width={12} height={12} style={{marginRight: 8}}/>
                    )}
                    <label className={`${styles.scheduleText} ${styles[scheduleStyleKeySuffix]}`}>{scheduleString}</label>
                </div>
            </li>
        )
    })
}