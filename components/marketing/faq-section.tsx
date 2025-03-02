"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function FaqSection() {
  return (
    <section className="container relative">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold leading-tight">Frequently Asked Questions</h2>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4 rounded-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="license">License</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>How many have purchased Achromatic so far?</AccordionTrigger>
                <AccordionContent>
                  More than 300 licenses have been sold already. Ranging from solopreneurs to enterprise with multiple
                  teams.
                </AccordionContent>
              </AccordionItem>
              {/* Add more FAQ items */}
            </Accordion>
          </TabsContent>
          {/* Add other tab contents */}
        </Tabs>
      </div>
    </section>
  )
}

