import styles from "../styles/join.module.css"

export default function NaviStep({step}) {
    return (
        <div className={'naviStep'}>
            <span className={step >= 1 ? 'on' : ''}></span>
            <span className={step >= 2 ? 'on' : ''}></span>
            <span className={step >= 3 ? 'on' : ''}></span>
            {/*<span className={step === 4 ? 'on' : ''}></span>*/}
        </div>
    );
}