package com.invoice_management_system.controller;

import com.invoice_management_system.model.User;
import com.invoice_management_system.service.DashboardService;
import com.invoice_management_system.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    @Autowired
    public DashboardController(DashboardService dashboardService, UserService userService) {
        this.dashboardService = dashboardService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardData(Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        Map<String, Object> dashboardData = dashboardService.getDashboardData(user);
        
        return ResponseEntity.ok(dashboardData);
    }
}
//
//
//@GetMapping("/recent-invoices")
//public ResponseEntity<List<Invoice>> getRecentInvoices(Authentication authentication) {
//    User user = userService.getUserFromAuthentication(authentication);
//    List<Invoice> recentInvoices = dashboardService.getRecentInvoices(user);
//    return ResponseEntity.ok(recentInvoices);
//}
//
//@GetMapping("/revenue")
//public ResponseEntity<Map<String, Object>> getRevenueData(Authentication authentication) {
//    User user = userService.getUserFromAuthentication(authentication);
//    Map<String, Object> revenueData = dashboardService.getRevenueData(user);
//    return ResponseEntity.ok(revenueData);
//}