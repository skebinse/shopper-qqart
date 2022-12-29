import {useEffect} from "react";
import Common from "../js/common";

export default function Index(props) {

    const $cmm = Common();

    useEffect(() => {

        $cmm.checkLogin(true);
    }, []);

    return (
        <>
        Index
        </>
    )
}
