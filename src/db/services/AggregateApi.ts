import { Aggregate } from "mongoose";
import { SearchQuery } from "../../types/searchParams.js";
import { z } from "zod";

class AggregateApi {
  public aggregation: Aggregate<any[]>;
  private query: SearchQuery;
  private skip: number = 0;
  private limit: number = 20;
  constructor(aggregation: Aggregate<any[]>, query: SearchQuery) {
    this.aggregation = aggregation;
    this.query = query;
  }
  sort(sortName?: string) {
    if (this.query.sort) {
      const sortFields = this.query.sort.split(",");

      sortFields.forEach((fields: string) => {
        const hasMinusSymbol = /-/.test(fields);
        let field = hasMinusSymbol ? fields.slice(1) : fields;
        this.aggregation.append({
          $sort: {
            [field]: hasMinusSymbol ? -1 : 1,
          },
        });
      });

      return this;
    } else if (sortName) {
      const sortFields = sortName.split(",");
      sortFields.forEach((fields: string) => {
        const hasMinusSymbol = /-/.test(fields);
        let field = hasMinusSymbol ? fields.slice(1) : fields;
        this.aggregation.append({
          $sort: {
            [field]: hasMinusSymbol ? -1 : 1,
          },
        });
      });
      return this;
    }
    return this;
  }
  project() {
    if (this.query.project) {
      const projectFields = this.query.project.split(",");
      let projectObj: { [index: string]: number } = {};

      projectFields.forEach((fields: string) => {
        const hasMinusSymbol = /-/.test(fields);
        let field = hasMinusSymbol ? fields.slice(1) : fields;
        projectObj[field] = hasMinusSymbol ? 0 : 1;
      });
      this.aggregation.append({
        $project: projectObj,
      });
      return this;
    } else {
      this.aggregation.append({
        $project: {
          __v: 0,
        },
      });
      return this;
    }
  }
  getSkip() {
    return this.skip;
  }
  getLimit() {
    return this.limit;
  }
  setSkip() {
    if (this.skip !== Number(this.query.skip)) {
      this.setPaginationDefaults();
    }
    this.aggregation.append({
      $skip: this.skip,
    });
    return this;
  }
  setLimit() {
    if (this.limit !== Number(this.query.limit)) {
      this.setPaginationDefaults();
    }
    this.aggregation.append({
      $limit: this.limit,
    });

    return this;
  }
  setPaginationDefaults() {
    const limitSchema = z
      .enum(["1", "2", "3", "4", "5", "10", "15", "20", "30", "40"])
      .catch("20");
    const schemaRes = limitSchema.parse(this.query.limit);
    this.limit = Number(schemaRes);
    if (this.query.skip) {
      this.skip = Number(this.query.skip);
    }
  }
  getInfinitePagination(awaitedArr: any[]) {
    this.setPaginationDefaults();
    //calculates total records
    this.aggregation.append({
      $count: "total_records",
    });
    this.aggregation.append({
      $addFields: {
        content_length: awaitedArr.length,
      },
    });
    this.aggregation.append({
      $addFields: {
        page_limit: this.limit,
      },
    });

    this.aggregation.append({
      $addFields: {
        next: {
          $let: {
            vars: {
              total_skip: {
                $add: ["$page_limit", this.skip || 0],
              },
            },
            in: {
              $cond: {
                if: {
                  $gte: ["$$total_skip", "$total_records"],
                },
                then: null,
                else: "$$total_skip",
              },
            },
          },
        },
      },
    });

    return this;
  }
}
export default AggregateApi;
