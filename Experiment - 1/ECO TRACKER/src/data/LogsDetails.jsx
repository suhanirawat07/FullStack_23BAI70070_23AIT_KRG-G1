import logs from './logs.js'

const total = logs.reduce((acc, curr) => {
    return acc + curr.carbon;
},0);

const exceeds = logs.filter((curr) => {
    if(curr.carbon >= 4) return curr;
});

const LogsDetails = () => {
    return(
        <div className='LogsD'>
        <h1>Total Carbon : {total}</h1>
        <div>
            <h2>Activities</h2>
            <ul>
                {logs.map((log) => (
                        <li key = {log.id} >
                            {log.activity} = {log.carbon} kgs;
                        </li>
                    ))}
            </ul>
        </div>
        <div>
            <h2>High Carbon Activities</h2>
            <ul>
                {exceeds.map((item) => (
                        <li key = {item.id} >
                            {item.activity} = {item.carbon} kgs;
                        </li>
                    ))}
            </ul>
        </div>
        </div>
    )
}

export default LogsDetails;