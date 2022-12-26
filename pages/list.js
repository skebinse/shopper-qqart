import {useEffect} from "react";

export default function List() {

    useEffect(() => {
        console.log('list')
        fetch('/api/hello').then(res => res.json()).then(res => console.log(res));
    }, []);

    return <>
        <h1>List</h1>
    </>
}