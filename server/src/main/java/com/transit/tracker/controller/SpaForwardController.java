package com.transit.tracker.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping("/lab/nyc")
    public String forwardNycLab() {
        return "forward:/index.html";
    }
}
