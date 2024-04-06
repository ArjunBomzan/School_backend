const resourceNotfound = (req, res) => {
    res.status(404).send("Resource not found")
}

const handleServererro = (err, req, res, next) => {
    console.log("err console",err)
// res.send(err)
// return
    if (err.name == "ValidationError") {
        statuscode = 400;
        message = "Bad Request"
        res.status(statuscode).send({
            message,
            error: err.message
        })

        return
    }
    res.status(500).send({
        error: "server error"
    })
}

module.exports={
    handleServererro,resourceNotfound
}