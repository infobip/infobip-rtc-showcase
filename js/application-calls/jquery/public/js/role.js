$(document).ready(function () {
    getApplicationId();
    setOnClickEventListeners();
});

function setOnClickEventListeners() {
    $('#agent-btn').click(loginAgent);
    $('#customer-btn').click(loginCustomer);
}

function loginAgent() {
    window.location.hash = 'agent';
}

function loginCustomer() {
    window.location.hash = 'customer';
}
