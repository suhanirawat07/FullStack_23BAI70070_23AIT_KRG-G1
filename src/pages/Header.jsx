const Header = ({title}) => {
    return (
        <header style = {{
            padding: '10px',
            backgroundColor: '#8f3b98',
            color : 'white',
            textAlign: 'center',
        }}> 
        <h1>{title}</h1>
        </header>
    )
}
export default Header;