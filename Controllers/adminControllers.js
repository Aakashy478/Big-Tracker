const { generateToken } = require("../Middlewares/authenticate");
const Employee = require("../Models/Employee");
const EmployeeTracking = require("../Models/EmployeeTracking");
const { comparePassword } = require("../Utils/passwordUils");

const addEmployee = async (req, res) => {
    try {
        const { name, mobile, email, username, password } = req.body;

        const existsUser = await Employee.findOne({ email });

        if (existsUser) {
            return res.status(400).json({ message: "Email is already register. Please log in." })
        }

        const newUser = {
            name,
            mobile,
            email,
            password,
            username,
        }

        await Employee.create(newUser);

        res.status(200).json({ message: "Employee Added successfully!" });
    } catch (error) {
        console.log("Error in addEmployee:- ", error);
        res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await Employee.findOne({ username, isDisable: false });

        if (!user) {
            return res.status(404).json({ message: "Invailid username. Enter valid username." })
        }

        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            return res.status(404).json({ message: "Invailid password. Enter valid username." });
        }

        generateToken(user, res);
        req.user = user;

        res.status(200).json(user);
    } catch (error) {
        console.log("Error in login:- ", error.message);
        return res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
}

const deleteEmployee = async (req, res) => {
    try {
        const empId = req.params.id;

        const employee = await Employee.findOne({ _id: empId });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found!" });
        }

        // Soft Delete (Mark as Disabled)
        employee.isDisable = true;
        await employee.save();

        res.status(200).json({ message: "Employee disabled successfully!" });
    } catch (error) {
        console.log("Error in Delete Employee:", error.message);
        return res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
};

const getVisits = async (req, res) => {
    try {
        const { username } = req.query;  // Get the username from the query parameters

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const user = await Employee.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch the visits using the username and populate the 'employeeId' field
        const visits = await EmployeeTracking.findOne({ employeeId: user._id }).populate('visits');

        console.log(visits);

        if (!visits) {
            return res.status(404).json({ error: 'No visits found for this username' });
        }

        return res.json(visits.visits);
    } catch (error) {
        console.error("Error in getVisits:- ", error.message);
        res.status(500).json({ message: "Something went wrong. Try again later." });
    }
}


// Logout
const logout = async (req, res) => {
    try {
        // Clear the authentication token from cookies
        res.clearCookie("authToken");

        res.status(200).json({ message: "Logout successfully!" });
    } catch (error) {
        console.error("Logout Error:", error.message);
        res.status(500).json({ message: "Something went wrong. Try again later." });
    }
};

module.exports = { addEmployee, login, deleteEmployee, getVisits, logout };