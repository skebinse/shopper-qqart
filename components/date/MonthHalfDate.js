import React, {useCallback, useEffect, useState} from 'react';
import Image from "next/image";
import cmm from "../../js/common";

export default function MonthHalfDate({onSelectDate, isNextWeek = false, title = ''}) {

    const [searchDate, setSearchDate] = useState({toDt: '', fromDt: ''});
    const [isLastDate, setIsLastDate] = useState(false);

    /**
     * 조회 일자 변경
     * @param kd
     */
    const searchDateChange = kd => {


        // 오늘일자 보다 큰 경우 return
        if(kd === 'next' && !isNextWeek && searchDate.toDt >= cmm.date.getToday('-')) return;

        let stdDate;

        if(!!kd) {

            if(cmm.date.parseDate(searchDate.fromDt).getDate() < 15) {

                if(kd === 'next') {

                    stdDate = cmm.date.calDateReturnDt(searchDate.fromDt, 'D', 15);
                } else {

                    stdDate = cmm.date.calDateReturnDt(searchDate.fromDt, 'D', -10);
                }
            } else {

                if(kd === 'next') {

                    stdDate = cmm.date.calDateReturnDt(searchDate.fromDt, 'M', 1);
                    stdDate.setDate(1);
                } else {

                    stdDate = cmm.date.calDateReturnDt(searchDate.fromDt, 'D', -15);
                }
            }
        } else {

            stdDate = new Date();
        }

        const date = stdDate.getDate();

        const yyyyMM = stdDate.getFullYear() + '-' + cmm.util.lpad((stdDate.getMonth() + 1), 2, 0);
        let fromDt;
        let toDt;
        if(date < 15) {

            fromDt = yyyyMM + '-01';
            toDt = yyyyMM + '-15';
        } else {

            fromDt = yyyyMM + '-16';
            toDt = cmm.date.calDate(cmm.date.calDate(yyyyMM + '-01', 'M', 1, ''), 'D', -1, '-');
        }

        const selectDate = {
            fromDt,
            toDt,
            text: `${fromDt.substring(2).replace('-', '년 ').replace('-', '월')}일 ~ ${toDt.substring(5).replace('-', '월')}일`
        };

        setSearchDate(selectDate);

        if(!isNextWeek) {

            // 오늘보다 큰 날일 경우
            setIsLastDate(toDt >= cmm.date.getToday('-'));
        }

        // calblack
        !!onSelectDate && onSelectDate(selectDate);
    };

    useEffect(() => {

        // 조회 일자 변경
        searchDateChange();
    }, []);

    return (
        <div className={'weekDateDiv'}>
            <span>{title}</span>
            <div>
                <Image src={'/assets/images/icon/iconArrowL.svg'} alt={'이전일자'} width={24} height={24} onClick={() => searchDateChange('prev')} />
                <span>{searchDate?.text}</span>
                <Image className={isLastDate ? 'noVtlz' : ''} src={'/assets/images/icon/iconArrowL.svg'} alt={'다음일자'} width={24} height={24} onClick={() => searchDateChange('next')} />
            </div>
        </div>
    );
}