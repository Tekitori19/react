interface CardProps {
    children?: React.ReactNode,
    title: string,
    content: string
}

const Card = ({ children, title, content }: CardProps) => {
    return (
        <div
            style={{
                border: "1px solid #ccc",
                margin: "10px",
                padding: "10px",
                borderRadius: "5px",
            }
            }
        >
            <h3>{title}</h3>
            <p>{content}</p>
            {children && <div>{children}</div>}
        </div >
    )
}

export default Card
