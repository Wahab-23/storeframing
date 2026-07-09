
export default function Login() {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen">
            <h1>Login</h1>
            {/* form for username and password */}
            <form className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" placeholder="Username" />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" placeholder="Password" />
                </div>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Login</button>
            </form>
        </div>
    );
}