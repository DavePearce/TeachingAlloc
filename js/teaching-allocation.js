/**
 * Provides a bunch of helper methods for calculating teaching
 * allocation.
 *
 * By David J. Pearce, 2013
 */


/**
 * Calculate the effective FTE of a staff member.  This is determined
 * starting from their base FTE (i.e. as determined by their
 * employment contract), less any leave they are taking and/or buy out
 * they have (e.g. from grants).
 */ 
function calculate_effective_fte(fte,buyout,leave) {
  return Math.max(0,fte - buyout - leave);
}

/**
 * Calculate the load for a given course.  This is set at 1.0 for the
 * normal case, and is adjusted for these criteria:
 *
 * 1) A large course is considered > 80 students, and given an
 *    additional 0.15 loading.
 * 
 * 2) A new course is given a 100% additional loading in its first
 *    year, and a 50% additional loading in its second.
 */
function calculate_course_load(course_record) {
  // 
  // FIXME: This calculation is incorrect!
  //
  if(course_record.expected >= 80) {
     return 1.15;
  } else {
     return 1.0;
  }
}

/**
 * Calculate the teaching load for a given course allocation.
 */
function calculate_lecturing_load(allocation) {
  var load = 0;
  for(var i=0;i!=allocation.length;++i) {
      var allocation_record = allocation[i];
      var course_load = 1 * allocation_record.load;    
      
      if(allocation_record.coordinator) {
	  // A standard course will be allocated a workload cost of 1.0
	  // and an additional 0.1 will be given to the Course
	  // Coordinator (C)
	  course_load = course_load + 0.1;      
      }
      
      load = load + course_load;
  }

  // NB: in calculation below, 3 for normal number of courses, 2
  // because shared between supervision.
  return load / (3*2);
}

function calculate_supervision_load(allocation) {
  return 0.5;
}

/**
 * Calculate the allocation of courses to individual staff members,
 * including their current workload allocation.
 */
function calculate_staff_allocation(allocation_records) {
  var staff_records = {};

  // First, merge records together for each staff member.
  for(var i=0;i!=allocation_records.length;i=i+1) {
     var allocation_record = allocation_records[i];
     var staff_name = allocation_record.name;
     var course_name = allocation_record.course;
     var course_load = allocation_record.load;
     var course_coordinator = allocation_record.coordinator;

     if(!(staff_name in staff_records)) {
         // first time this staff member encountered, so create empty
         // record.
         staff_records[staff_name] = { name: staff_name, allocation: [] };
     } 
     // Add this course to staff members allocations arrays
     var staff_record = staff_records[staff_name];
     staff_record.allocation.push({name: course_name, load: course_load, coordinator: course_coordinator});
  }

  // Second, flatten into an array and sort
  var sorted_records = [];
  var count = 0;
  for(var staff_name in staff_records) {
      var staff_record = staff_records[staff_name];
      staff_record.teaching_load = calculate_lecturing_load(staff_record.allocation);
      staff_record.supervision_load = calculate_supervision_load();
      sorted_records[count++] = staff_record;
  }
  // done
  return sorted_records;
}

/**
 * Calculate the allocation of staff to individual courses, including
 * their current workload allocation.
 */
function calculate_course_allocation(allocation_records) {
  var course_records = {};

  // First, merge records together for each course.
  for(var i=0;i!=allocation_records.length;i=i+1) {
     var allocation_record = allocation_records[i];
     var staff_name = allocation_record.name;
     var course_name = allocation_record.course;
     var course_load = allocation_record.load;
     var course_coordinator = allocation_record.coordinator;

     if(!(course_name in course_records)) {
         // first time this staff member encountered, so create empty
         // record.
         course_records[course_name] = { name: course_name, load: 0.0, allocation: [] };
     } 
     // Add this course to staff members allocations arrays
     var course_record = course_records[course_name];
     course_record.allocation.push({name: staff_name, load: course_load, coordinator: course_coordinator});
     course_record.load += course_load;
  }

  // Second, flatten into an array and sort
  var sorted_records = [];
  var count = 0;
  for(var course_name in course_records) {
     sorted_records[count++] = course_records[course_name];
  }
  // done
  return sorted_records;
}

/**
 * Convert an array of allocation records into a sensible string
 */
function to_allocation_string(records) {
  var result = "";
  for(var i=0;i!=records.length;++i) {
    if(i != 0) { result = result + ", "; }
    var record = records[i];
    result = result + record.name;
    if(record.coordinator) {
       result = result + "*";
    }
    result = result + " (" + (record.load * 100) + "%)";   
  }
  return result;
}
